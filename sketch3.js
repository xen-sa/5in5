// Sketch 3: same_words
let sketch3 = function(p) {
  let filesEnglish = [];
  let filesSpanish = [];
  let commonWords = [];
  let word, englishConcordance, spanishConcordance;
  let kwicEnglish, kwicSpanish;
  let englishCorpus = "";
  let corpusSpanish = "";
  let font;
  let yOffset = 0;
  let totalHeight = 0;

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
    container = document.getElementById("sketch3");
    let w = container.offsetWidth;
    let h = container.offsetHeight;
    let c = p.createCanvas(w, h);
    c.parent(container);
    p.textSize(20);
    p.colorMode(p.HSB);
    p.textFont(font);

    // enable scrolling if canvas exceeds window height
    document.body.style.overflow = 'auto';

    englishCorpus = "";
    corpusSpanish = "";
    let wordsEnglish = [];
    let wordsSpanish = [];

    for (let i = 1; i <= 10; i++) {
      englishCorpus += filesEnglish[i].join(" ") + " ";
    }
    for (let i = 1; i <= 33; i++) {
      corpusSpanish += filesSpanish[i].join(" ") + " ";
    }
    let corpus = corpusSpanish + englishCorpus;

    let corpusSpanishNormalized = removeAccents(corpusSpanish);

    let stopEn = new Set(["the", "and", "to", "of", "in", "a", "is", "that", "for", "a"]);
    let stopEs = new Set(["el", "la", "de", "y", "en", "que", "un", "una", "los"]);

    wordsEnglish = RiTa.tokenize(englishCorpus)
      .filter(w => /^[a-zA-Z]+$/.test(w))
      .filter(w => !stopEn.has(w))
      .map(w => w.toLowerCase());

    //// --- CHANGE --- remove accents only for word comparison
    wordsSpanish = RiTa.tokenize(corpusSpanishNormalized)
      .filter(w => /^[a-zA-Z]+$/.test(w))
      .filter(w => !stopEs.has(w))
      .map(w => w.toLowerCase());

    //get common words
    let setEnglish = new Set(wordsEnglish);
    let setSpanish = new Set(wordsSpanish);

    commonWords = [...setEnglish].filter(word => setSpanish.has(word));

    console.log(commonWords);

    word = pickRandomWord();
    if (!word) {
      console.error("No words found in corpus.");
      return;
    }
    RiTa.concordance(corpus);
  };

  p.draw = function() {
    // ensure given word has forms in both corpora
    let formEs = findWordInCorpus(word, corpusSpanish);
    let formEn = findWordInCorpus(word, englishCorpus);
    if (!formEs || !formEn) {
      // pick again if missing
      word = pickRandomWord();
      if (word) p.redraw();
      return;
    }

    // fetch sentences containing the exact word from both corpora
    let sentencesEs = RiTa.sentences(corpusSpanish).filter(s => new RegExp('\\b' + word + '\\b', 'i').test(s));
    let sentencesEn = RiTa.sentences(englishCorpus).filter(s => new RegExp('\\b' + word + '\\b', 'i').test(s));

    if (sentencesEs.length === 0 || sentencesEn.length === 0) {
      word = pickRandomWord();
      if (word) p.redraw();
      return;
    }

    let tw = p.textWidth(word) / 2;

    // collect all sentences
    let all = [];
    sentencesEs.forEach(s => all.push({ text: s, lang: 'spanish' }));
    sentencesEn.forEach(s => all.push({ text: s, lang: 'english' }));

    // deduplicate by text to avoid drawing the same sentence twice
    all = all.filter((e, i, arr) => arr.findIndex(x => x.text === e.text) === i);

    // randomize the order of sentences
    all = p.shuffle(all);

    // calculate total height needed for all sentences
    totalHeight = all.length * 24 + 100;

    p.background(95);
    let num = all.length; // show all
    for (let i = 0; i < num; i++) {
      let entry = all[i];
      let sentence = entry.text;

      // find the word in the sentence (case-insensitive match)
      let regex = new RegExp(word, 'i');
      let match = sentence.match(regex);
      if (match) {
        let index = sentence.indexOf(match[0]);
        let theWord = match[0];

        // extract part of the sentence around the word (40 chars left and right)
        let start = Math.max(0, index - 40);
        let end = Math.min(sentence.length, index + theWord.length + 40);
        let excerpt = sentence.substring(start, end);
        if (start > 0) excerpt = "..." + excerpt;
        if (end < sentence.length) excerpt = excerpt + "...";

        // find the word in the excerpt
        let excerptIndex = excerpt.indexOf(theWord);
        let before = excerpt.substring(0, excerptIndex);
        let after = excerpt.substring(excerptIndex + theWord.length);

        let y = i * 24 + 20 + yOffset;

        // only draw if visible
        if (y > -30 && y < p.height + 30) {
          // center the word at width/2
          let wordX = p.width / 2;
          let wordW = p.textWidth(theWord);

          p.fill(0);
          p.textAlign(p.RIGHT);
          p.text(before, wordX - wordW / 2, y);

          p.fill("red");
          p.textAlign(p.CENTER);
          p.text(theWord, wordX, y);

          p.fill(0);
          p.textAlign(p.LEFT);
          p.text(after, wordX + wordW / 2, y);
        }
      } else {
        // fallback
        let y = i * 24 + 90 + yOffset;
        if (y > -30 && y < p.height + 30) {
          p.text(sentence, 50, y);
        }
      }
    }

    p.noLoop();
  };

  p.mouseWheel = function(event) {
    if (
      p.mouseX >= 0 && p.mouseX <= p.width &&
      p.mouseY >= 0 && p.mouseY <= p.height &&
      totalHeight > p.height
    ) {
      yOffset -= event.delta;
      // Clamp yOffset
      yOffset = p.constrain(yOffset, -(totalHeight - p.height), 0);
      p.redraw();
      return false;
    }
    // allow page scroll if not over canvas
    return true;
  };

  // Arrow key scroll (only when mouse is over canvas)
  p.keyPressed = function() {
    let step = 40;
    if (
      p.mouseX >= 0 && p.mouseX <= p.width &&
      p.mouseY >= 0 && p.mouseY <= p.height &&
      totalHeight > p.height
    ) {
      if (p.keyCode === p.DOWN_ARROW) {
        yOffset = p.constrain(yOffset - step, -(totalHeight - p.height), 0);
        p.redraw();
      } else if (p.keyCode === p.UP_ARROW) {
        yOffset = p.constrain(yOffset + step, -(totalHeight - p.height), 0);
        p.redraw();
      }
    }
  };

  p.mousePressed = function() {
    if(p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height){
      let tries = 0;
      let maxTries = 100;
      do {
        word = pickRandomWord();
        tries++;
      } while (
        tries < maxTries &&
        (!word || !findWordInCorpus(word, englishCorpus) || !findWordInCorpus(word, corpusSpanish))
      );
      if (word && findWordInCorpus(word, englishCorpus) && findWordInCorpus(word, corpusSpanish)) {
        p.redraw();
      }
    }
  };

  function removeAccents(text) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function findWordInCorpus(word, corpus) {
    let normalizedCorpus = removeAccents(corpus);
    let idx = normalizedCorpus.indexOf(word);
    if (idx === -1) return null;

    // return the actual word from the corpus
    return corpus.substr(idx, word.length);
  }

  function pickRandomWord() {
    let tries = 0;
    let maxTries = 100;
    while (tries < maxTries) {
      let candidate = RiTa.random(commonWords);
      let spanishForm = findWordInCorpus(candidate, corpusSpanish);
      let englishForm = findWordInCorpus(candidate, englishCorpus);
      if (spanishForm && englishForm) return candidate;
      tries++;
    }
    return null;
  }

    p.windowResized = function() {
        let w = container.offsetWidth;
        let h = container.offsetHeight;
        p.resizeCanvas(w, h);
    };

};

new p5(sketch3, 'sketch3');