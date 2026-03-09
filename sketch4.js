let sketch4 = function(p) {
  let leftSound, rightSound;
  let ctx;
  let isPaused = true;

  if (typeof window.sharedData === 'undefined') {
      window.sharedData = {};
  }

  let randomSpanish;
  let randomEnglish;

  let englishLines, spanishLines;

  let englishTranscript = [];
  let spanishTranscript = [];

  let englishParagraph = "";
  let spanishParagraph = "";

  let englishIndex = 0;
  let spanishIndex = 0;

  let font;

  const sizeText = 14;

  let fftLeft, fftRight;

  // SPECTROGRAM BUFFERS
  let specLeft = [];
  let specRight = [];

  const specHistory = 200;
  const specBins = 64;

  p.preload=function() {

    randomSpanish = p.int(p.random(1,35));
    randomEnglish = p.int(p.random(1,10));

    font = p.loadFont("font.ttf");

    window.sharedData.randomSpanish = randomSpanish;
    window.sharedData.randomEnglish = randomEnglish;

    leftSound = p.loadSound("soundFiles/english/" + randomEnglish + ".m4a");
    rightSound = p.loadSound("soundFiles/spanish/" + randomSpanish + ".m4a");
    // Standardize volume for both sounds
    // 0.7 is a typical normalized value; adjust as needed
    leftSound.setVolume(0.7);
    rightSound.setVolume(0.7);

    englishLines = p.loadStrings("textFiles/english/" + randomEnglish + ".txt");
    spanishLines = p.loadStrings("textFiles/spanish/" + randomSpanish + ".txt");
  }

  p.setup=function() {

    container = document.getElementById("sketch4");
    let w = container.offsetWidth;
    let h = container.offsetHeight;

    let c = p.createCanvas(w, h);
    c.parent(container);

    p.textAlign(p.LEFT,p.TOP);
    p.textSize(sizeText);
    p.textWrap(p.WORD);
    p.colorMode(p.HSB);

    p.textFont(font);

    parseTranscript(englishLines, englishTranscript);
    parseTranscript(spanishLines, spanishTranscript);

    ctx = p.getAudioContext();

    let merger = ctx.createChannelMerger(2);

    leftSound.disconnect();
    rightSound.disconnect();

    let splitL = ctx.createChannelSplitter(2);
    let splitR = ctx.createChannelSplitter(2);

    leftSound.connect(splitL);
    rightSound.connect(splitR);

    splitL.connect(merger, 0, 0);
    splitR.connect(merger, 0, 1);

    merger.connect(ctx.destination);

    fftLeft = new p5.FFT(0.8, specBins);
    fftLeft.setInput(leftSound);

    fftRight = new p5.FFT(0.8, specBins);
    fftRight.setInput(rightSound);
  }

  p.draw=function() {

    p.background(95);

    p.stroke(255);
    p.line(p.width/2,0,p.width/2,p.height);

    if(leftSound.isPlaying()) updateEnglish();
    if(rightSound.isPlaying()) updateSpanish();

    p.noStroke();
    p.fill(0);

    newHeight = p.height*0.6;

    let boxHeight = newHeight - 20;
    let boxWidth = p.width/2 - 20;
    let leading = sizeText-4;

    p.textLeading(leading);

    // ENGLISH TEXT
    let engLines = p.split(englishParagraph, /\n|(?<=\s)/g);
    let engWrapped = [];
    let temp = "";

    for (let w of engLines.join('').split(' ')) {

        if (p.textWidth(temp + w + ' ') > boxWidth) {
            engWrapped.push(temp.trim());
            temp = w + ' ';
        } else {
            temp += w + ' ';
        }
    }

    if (temp.trim().length > 0) engWrapped.push(temp.trim());

    let totalEngLines = engWrapped.length;

    if (typeof p.yOffsetEng === 'undefined') p.yOffsetEng = 0;

    let maxLines = Math.floor(boxHeight / leading);

    p.yOffsetEng = p.constrain(p.yOffsetEng, -(totalEngLines - maxLines), 0);

    let startEng = Math.max(0, totalEngLines - maxLines + p.yOffsetEng);

    let engToShow = engWrapped.slice(startEng, startEng + maxLines).join('\n');

    p.text(engToShow, 10, 10, boxWidth, boxHeight);

    // SPANISH TEXT
    let spaLines = p.split(spanishParagraph, /\n|(?<=\s)/g);
    let spaWrapped = [];

    temp = "";

    for (let w of spaLines.join('').split(' ')) {

        if (p.textWidth(temp + w + ' ') > boxWidth) {
            spaWrapped.push(temp.trim());
            temp = w + ' ';
        } else {
            temp += w + ' ';
        }
    }

    if (temp.trim().length > 0) spaWrapped.push(temp.trim());

    let totalSpaLines = spaWrapped.length;

    if (typeof p.yOffsetSpa === 'undefined') p.yOffsetSpa = 0;

    p.yOffsetSpa = p.constrain(p.yOffsetSpa, -(totalSpaLines - maxLines), 0);

    let startSpa = Math.max(0, totalSpaLines - maxLines + p.yOffsetSpa);

    let spaToShow = spaWrapped.slice(startSpa, startSpa + maxLines).join('\n');

    p.text(spaToShow, p.width/2 + 10, 10, boxWidth, boxHeight);

    // SCROLLING SPECTROGRAM
    updateSpectrogram();

    // Fit spectrograms to lower half of canvas
    let specY = p.height * 0.6;
    let specH = p.height * 0.4 - 5;
    drawSpectrogram(specLeft, 10, specY, p.width/2 - 20, specH);
    drawSpectrogram(specRight, p.width/2 + 10, specY, p.width/2 - 20, specH);
  }

  p.mousePressed=function() {

    if (p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height){

        if (isPaused){

            p.userStartAudio();

            leftSound.play();
            rightSound.play();

            isPaused = false;

        } else {

            leftSound.pause();
            rightSound.pause();

            isPaused = true;
        }
    }
  }

  function parseTranscript(lines, targetArray){

    for(let l of lines){

        let match = l.match(/\[(\d+):(\d+)\]\s*(.*)/);

        if(match){

            let minutes = p.int(match[1]);
            let seconds = p.int(match[2]);
            let text = match[3];

            let time = minutes*60 + seconds;

            targetArray.push({
                time: time,
                text: text
            });
        }
    }
  }

  function updateEnglish(){

    let t = leftSound.currentTime();

    if(englishIndex < englishTranscript.length){

        if(t >= englishTranscript[englishIndex].time){

            englishParagraph += englishTranscript[englishIndex].text + " ";
            englishIndex++;

        }
    }
  }

  function updateSpanish(){

    let t = rightSound.currentTime();

    if(spanishIndex < spanishTranscript.length){

        if(t >= spanishTranscript[spanishIndex].time){

            spanishParagraph += spanishTranscript[spanishIndex].text + " ";
            spanishIndex++;

        }
    }
  }

  p.windowResized=function(){

      let w = container.offsetWidth;
      let h = container.offsetHeight;

      p.resizeCanvas(w,h);
  };

  function updateSpectrogram(){

    let spectrumL = fftLeft.analyze();
    let spectrumR = fftRight.analyze();

    specLeft.push(spectrumL);
    specRight.push(spectrumR);

    if(specLeft.length > specHistory) specLeft.shift();
    if(specRight.length > specHistory) specRight.shift();
  }

  function drawSpectrogram(arr,x,y,w,h){

    let columnWidth = w / specHistory;
    for(let t=0;t<arr.length;t++){
        let spectrum = arr[t];
        for(let f=0;f<spectrum.length;f+=2){ // skip every other bin for clarity
            let energy = spectrum[f];
            let px = x + t * columnWidth;
            let py = p.map(f,0,spectrum.length,y+h,y);
            // Map amplitude to brightness (0=black, 255=white)
            let bright = p.map(energy,0,255,0,255);
            p.noStroke();
            p.fill(0, 0, bright); // grayscale, high contrast
            p.rect(px,py,columnWidth,h/spectrum.length*2);
        }
    }
  }
}

new p5(sketch4, 'sketch4');