// Sketch 1: image_from_words
let sketch1 = function(p) {
  let paragraph = "";
  let filesEnglish = [];
  let filesSpanish = [];
  let capture;
  let buffer;
  const sizeText = 11;
  let container;
  let font;

  p.preload = function() {
    font = p.loadFont("font.ttf");

    for (let i = 0; i < 10; i++) {
      filesEnglish[i] = p.loadStrings("texts/textsEnglish/e" + (i + 1) + ".txt");
    }
    for (let i = 0; i < 33; i++) {
      filesSpanish[i] = p.loadStrings("texts/textsSpanish/" + (i + 1) + ".txt");
    }
  };

  p.setup = function() {
    container = document.getElementById("sketch1");
    let w = container.offsetWidth;
    let h = container.offsetHeight;
    let c = p.createCanvas(w, h);
    c.parent(container);

    p.pixelDensity(1);
    p.textSize(sizeText);
    p.textAlign(p.LEFT, p.TOP);
    p.noStroke();
    //p.textFont(font);

    capture = p.createCapture(p.VIDEO, { flipped: true });
    capture.size(p.width, p.height);
    capture.hide();

    buffer = p.createGraphics(p.width, p.height);

    // Collect all sentences from all English and Spanish files
    let allSentences = [];

    // Add sentences from English files
    for (let i = 0; i < filesEnglish.length; i++) {
      let text = filesEnglish[i].join(" ");
      let sentences = text.split(/(?<=[.!?])\s+/);
      allSentences = allSentences.concat(sentences);
    }

    // Add sentences from Spanish files
    for (let i = 0; i < filesSpanish.length; i++) {
      let text = filesSpanish[i].join(" ");
      let sentences = text.split(/(?<=[.!?])\s+/);
      allSentences = allSentences.concat(sentences);
    }

    // Shuffle the sentences
    allSentences = p.shuffle(allSentences);

    // Join shuffled sentences into paragraph
    paragraph = allSentences.join(" ");

    //paragraph=filesEnglish[window.sharedData.randomEnglish].join(" ")+" "+filesSpanish[window.sharedData.randomSpanish];
  };

  p.draw = function() {
    buffer.image(capture, 0, 0, p.width, p.width * capture.height / capture.width);
    buffer.filter(p.DILATE);
    buffer.filter(p.POSTERIZE, 5);
    buffer.loadPixels();

    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let count = 0;

    // sample every 20 pixels for speed
    let stride = buffer.pixels.length / 4 / buffer.height;

    for (let y = 0; y < buffer.height; y += 20) {
      for (let x = 0; x < buffer.width; x += 20) {
        let idx = (x + y * stride) * 4;
        rSum += buffer.pixels[idx];
        gSum += buffer.pixels[idx + 1];
        bSum += buffer.pixels[idx + 2];
        count++;
      }
    }

    let rAvg = rSum / count;
    let gAvg = gSum / count;
    let bAvg = bSum / count;

    let fade = 0.85; // closer to 1 = more white

    let rBg = p.lerp(rAvg, 255, fade);
    let gBg = p.lerp(gAvg, 255, fade);
    let bBg = p.lerp(bAvg, 255, fade);

    p.background(rBg, gBg, bBg);

    let words = paragraph.split(" ");
    let wordIndex = 0;

    let stepY = sizeText - 2; // line height

    for (let y = 0; y < p.height; y += stepY) {
      let xStep = 0;
      while (xStep < p.width) {
        let word = words[wordIndex];
        let wWidth = p.textWidth(word + " ");

        // Sample the pixel at the center of the word
        let px = Math.floor(xStep + wWidth / 2);
        let py = Math.floor(y + stepY / 2);

        px = p.constrain(px, 0, buffer.width - 1);
        py = p.constrain(py, 0, buffer.height - 1);

        // real pixel stride
        let stride = buffer.pixels.length / 4 / buffer.height;

        let idx = (px + py * stride) * 4;

        let r = buffer.pixels[idx];
        let g = buffer.pixels[idx + 1];
        let b = buffer.pixels[idx + 2];

        p.fill(r, g, b);        // text color from image
        p.text(word + " ", xStep, y);

        xStep += wWidth;
        wordIndex = (wordIndex + 1) % words.length;
      }
    }
  };

    p.windowResized = function() {
        let w = container.offsetWidth;
        let h = container.offsetHeight;
        p.resizeCanvas(w, h);
  };
};

new p5(sketch1, 'sketch1');