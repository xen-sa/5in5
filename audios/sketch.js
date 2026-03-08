let leftSound, rightSound;
let ctx;
let isPaused = true;

let randomSpanish;
let randomEnglish;

let englishLines, spanishLines;

let englishTranscript = [];
let spanishTranscript = [];

let englishParagraph = "";
let spanishParagraph = "";

let englishIndex = 0;
let spanishIndex = 0;

function preload() {

  randomSpanish = int(random(1,35));
  randomEnglish = int(random(1,10));

  leftSound = loadSound("soundFiles/english/" + randomEnglish + ".m4a");
  rightSound = loadSound("soundFiles/spanish/" + randomSpanish + ".m4a");

  englishLines = loadStrings("textFiles/english/" + randomEnglish + ".txt");
  spanishLines = loadStrings("textFiles/spanish/" + randomSpanish + ".txt");
}

function setup() {

  createCanvas(600,300);
  textAlign(LEFT,TOP);
  textSize(14);
  textWrap(WORD);

  parseTranscript(englishLines, englishTranscript);
  parseTranscript(spanishLines, spanishTranscript);

  ctx = getAudioContext();

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

}

function draw() {

  background(20);

  stroke(255);
  line(width/2,0,width/2,height);

  if(leftSound.isPlaying()){
    updateEnglish();
  }

  if(rightSound.isPlaying()){
    updateSpanish();
  }

  noStroke();
  fill(255);

  text(englishParagraph, 20, 20, width/2 - 40, height - 40);
  text(spanishParagraph, width/2 + 20, 20, width/2 - 40, height - 40);

}

function mousePressed() {

  if (isPaused === true) {

    userStartAudio();

    leftSound.play();
    rightSound.play();

    isPaused = false;

  } else {

    leftSound.pause();
    rightSound.pause();

    isPaused = true;
  }

}

function parseTranscript(lines, targetArray){

  for(let l of lines){

    let match = l.match(/\[(\d+):(\d+)\]\s*(.*)/);

    if(match){

      let minutes = int(match[1]);
      let seconds = int(match[2]);
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