let sketch4 = function(p) {
  let leftSound, rightSound;
  let ctx;
  let isPaused = true;

  // Shared global variables
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

  const sizeText=14;
  let fftLeft, fftRight;

  let waveLeft = [];
  let waveRight = [];

  const waveLength = 200;

  p.preload=function() {
    randomSpanish = p.int(p.random(1,35));
    randomEnglish = p.int(p.random(1,10));
    font = p.loadFont("font.ttf");

    // Store in global sharedData so other sketches can access
    window.sharedData.randomSpanish = randomSpanish;
    window.sharedData.randomEnglish = randomEnglish;

    leftSound = p.loadSound("soundFiles/english/" + randomEnglish + ".m4a");
    rightSound = p.loadSound("soundFiles/spanish/" + randomSpanish + ".m4a");

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

    fftLeft = new p5.FFT();
    fftLeft.setInput(leftSound);

    fftRight = new p5.FFT();
    fftRight.setInput(rightSound);
  }

  p.draw=function() {
    p.background(95);

    p.stroke(255);
    p.line(p.width/2,0,p.width/2,p.height);

    if(leftSound.isPlaying()){
        updateEnglish();
    }

    if(rightSound.isPlaying()){
        updateSpanish();
    }

    p.noStroke();
    p.fill(0);

    newHeight = p.height*0.8;

    // Show only the last lines that fit in the box
    let boxHeight = newHeight - 20;
    let boxWidth = p.width/2 - 20;
    let leading = sizeText-4;
    p.textLeading(leading);

    // English side
    let engLines = p.split(englishParagraph, /\n|(?<=\s)/g);
    // Re-wrap to fit box width
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

    // Spanish side
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
    // Mouse wheel scroll (only when mouse is over canvas)
    p.mouseWheel = function(event) {
        let overEng = p.mouseX >= 10 && p.mouseX <= (10 + boxWidth);
        let overSpa = p.mouseX >= (p.width/2 + 10) && p.mouseX <= (p.width/2 + 10 + boxWidth);
        let maxLines = Math.floor((p.height*0.8 - 20) / (sizeText - 4));
        if (overEng && totalEngLines > maxLines) {
            p.yOffsetEng -= Math.sign(event.delta);
            p.yOffsetEng = p.constrain(p.yOffsetEng, -(totalEngLines - maxLines), 0);
            p.redraw();
            return false;
        } else if (overSpa && totalSpaLines > maxLines) {
            p.yOffsetSpa -= Math.sign(event.delta);
            p.yOffsetSpa = p.constrain(p.yOffsetSpa, -(totalSpaLines - maxLines), 0);
            p.redraw();
            return false;
        }
        return true;
    };

    // Arrow key scroll (when mouse is over canvas)
    p.keyPressed = function() {
        let step = 1;
        let maxLines = Math.floor((p.height*0.8 - 20) / (sizeText - 4));
        let overEng = p.mouseX >= 10 && p.mouseX <= (10 + boxWidth);
        let overSpa = p.mouseX >= (p.width/2 + 10) && p.mouseX <= (p.width/2 + 10 + boxWidth);
        if (overEng && totalEngLines > maxLines) {
            if (p.keyCode === p.DOWN_ARROW) {
                p.yOffsetEng = p.constrain(p.yOffsetEng - step, -(totalEngLines - maxLines), 0);
                p.redraw();
            } else if (p.keyCode === p.UP_ARROW) {
                p.yOffsetEng = p.constrain(p.yOffsetEng + step, -(totalEngLines - maxLines), 0);
                p.redraw();
            }
        } else if (overSpa && totalSpaLines > maxLines) {
            if (p.keyCode === p.DOWN_ARROW) {
                p.yOffsetSpa = p.constrain(p.yOffsetSpa - step, -(totalSpaLines - maxLines), 0);
                p.redraw();
            } else if (p.keyCode === p.UP_ARROW) {
                p.yOffsetSpa = p.constrain(p.yOffsetSpa + step, -(totalSpaLines - maxLines), 0);
                p.redraw();
            }
        }
    };

    updateWaveforms();

    drawScrollingWave(waveLeft, 10, newHeight, p.width/2 - 20, 100);
    drawScrollingWave(waveRight, p.width/2 + 10, newHeight, p.width/2 - 20, 100);
  }

  p.mousePressed=function() {
      if (p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height){
          if (isPaused === true) {
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

  p.windowResized = function() {
      let w = container.offsetWidth;
      let h = container.offsetHeight;
      p.resizeCanvas(w, h);
  };

  function updateWaveforms(){

    let wfL = fftLeft.waveform();
    let wfR = fftRight.waveform();

    // take a single representative sample
    let sampleL = wfL[wfL.length/2];
    let sampleR = wfR[wfR.length/2];

    waveLeft.push(sampleL);
    waveRight.push(sampleR);

    if(waveLeft.length > waveLength) waveLeft.shift();
    if(waveRight.length > waveLength) waveRight.shift();

}

  function drawScrollingWave(arr,x,y,w,h){
    p.stroke(0,0,0);
    p.noFill();
    p.beginShape();

    for(let i=0;i<arr.length;i++){
        let px = p.map(i,0,waveLength,x,x+w);
        let py = p.map(arr[i],-1,1,y+h/2,y-h/2);

        p.vertex(px,py);
    }

    p.endShape();
  }
}

new p5(sketch4, 'sketch4');