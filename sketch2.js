// Sketch 2: phrase_generator
let sketch2 = function(p) {
  let markovEnglish, markovSpanish, currentLanguage;
  let phrase = "";
  let corpusEnglish = "";
  let corpusSpanish = "";
  let filesEnglish = [];
  let filesSpanish = [];

  let rotationAngle = 0;
  let sizeText = 18;
  let font;
  let container;

  p.preload = function() {
    font = p.loadFont("font.ttf");
    for (let i = 1; i <= 10; i++) {
      filesEnglish[i] = p.loadStrings("texts/textsEnglish/e" + i + ".txt");
    }
    for (let i = 1; i <= 33; i++) {
      filesSpanish[i] = p.loadStrings("texts/textsSpanish/" + i + ".txt");
    }
  };

  p.setup = function() {
    container = document.getElementById("sketch2");
    let w = container.offsetWidth;
    let h = container.offsetHeight;
    let c = p.createCanvas(w, h);
    c.parent(container);
    
    p.colorMode(p.HSB);
    p.noStroke();
    p.textFont(font);

    for (let i = 1; i <= 10; i++) {
      corpusEnglish += filesEnglish[i].join(" ") + " ";
    }
    for (let i = 1; i <= 33; i++) {
      corpusSpanish += filesSpanish[i].join(" ") + " ";
    }

    markovEnglish = RiTa.markov(2);
    markovEnglish.addText(corpusEnglish);

    markovSpanish = RiTa.markov(2);
    markovSpanish.addText(corpusSpanish);

    phrase = "Click anywhere to generate a phrase";
    p.fill(0, 0, 0);
    p.textSize(sizeText);
  };

  p.draw = function() {
    p.background(95);
    p.textWrap(p.WORD);
    rotationAngle -= p.radians(p.frameRate() / 60); // rotate faster

    // adjust circle radius based on phrase length, but limit to half canvas height
    let base = 100;
    let extra = phrase.length * 2; // grow 2px per character
    let radius = base + extra;
    let minDim = p.min(p.width, p.height);
    let maxRadius = minDim / 2 - minDim / 8;
    radius = p.min(radius, maxRadius);

    // build list of radii for up to three rings
    let radii = [];
    radii.push(radius);
    radii.push(p.max(radius - sizeText * 2, sizeText * 2));
    radii.push(p.max(radii[1] - sizeText * 2, sizeText * 2));

    let remaining = phrase;
    let x = p.width / 2, y = p.height / 2;

    for (let i = 0; i < radii.length && remaining.length > 0; i++) {
      let r = radii[i];
      let spacing = p.map(r, 150, 600, 5, 1);
      spacing = p.constrain(spacing, 1, 5);
      let maxChars = Math.floor(p.TWO_PI / p.radians(spacing));
      if (remaining.length <= maxChars) {
        rotateText(p, x, y, r, remaining);
        remaining = "";
      } else {
        let segment = remaining.substring(0, maxChars);
        rotateText(p, x, y, r, segment);
        remaining = remaining.substring(maxChars);
      }
    }
    // any leftover beyond three rings is simply ignored
  };

  p.mousePressed = function() {
    if (p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height){
        generatePhrase(p);
    }
  };

  function generatePhrase(p) {
    currentLanguage = p.random(['english', 'spanish']);
    if (currentLanguage === 'english') {
      phrase = markovEnglish.generate();
      p.fill(p.random(120, 200), p.random(20, 100), p.random(60, 80));
    } else {
      phrase = markovSpanish.generate();
      p.fill(p.random(300, 350), p.random(20, 100), p.random(60, 80));
    }
  }

  function rotateText(p, x, y, radius, txt) {
    let chars = txt.split("");
    // spacing decreases as circle grows: larger radius -> smaller angle
    // base spacing 5 degrees at small radius, down to 1 degree at large radius
    let charSpacingAngleDeg = p.map(radius, 100, 600, 5, 1);
    charSpacingAngleDeg = p.constrain(charSpacingAngleDeg, 1, 5);

    p.textAlign(p.CENTER, p.BASELINE);

    p.push();
    p.translate(x, y);
    p.rotate(rotationAngle);

    p.rotate(p.radians(-chars.length * charSpacingAngleDeg / 2));

    for (let i = 0; i < chars.length; i++) {
      p.text(chars[i], 0, -radius);

      // Then keep rotating forward per character
      p.rotate(p.radians(charSpacingAngleDeg));
    }
    p.pop();
  }
    
  p.windowResized = function() {
        let w = container.offsetWidth;
        let h = container.offsetHeight;
        p.resizeCanvas(w, h);
    };
};

new p5(sketch2, 'sketch2');