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


    p.preload=function() {
        randomSpanish = p.int(p.random(1,35));
        randomEnglish = p.int(p.random(1,10));

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
        p.textSize(14);
        p.textWrap(p.WORD);

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
    }

    p.draw=function() {
        p.background(20);

        p.stroke(255);
        p.line(p.width/2,0,p.width/2,p.height);

        if(leftSound.isPlaying()){
            updateEnglish();
        }

        if(rightSound.isPlaying()){
            updateSpanish();
        }

        p.noStroke();
        p.fill(255);

        p.text(englishParagraph, 20, 20, p.width/2 - 40, p.height - 40);
        p.text(spanishParagraph, p.width/2 + 20, 20, p.width/2 - 40, p.height - 40);
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
}

new p5(sketch4, 'sketch4');