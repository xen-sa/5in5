let sketch5 = function(p) {
    //left: english
    let sound;
    let lines;
    transcript=[];
    paragraph="";
    index=0;
    let isPaused = true;

    //let ctx;

    p.preload=function() {
        let random = p.int(p.random(1,10));
        sound = p.loadSound("soundFiles/english/" + random + ".m4a");
        lines = p.loadStrings("textFiles/english/" + randomEnglish + ".txt");
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

        parseTranscript(lines, transcript);
    }

    p.draw=function() {
        p.background(255);

        if (sound.isPlaying()) {
            updateParagraph();
        }

        p.noStroke();
        p.fill(20);

        p.text(paragraph, 20, 20, p.width - 40, p.height - 40);

        p.fill(150);
        p.textSize(12);
        p.text("click to play / pause", p.width/2, p.height - 20);
    }

    p.mousePressed=function() {
        if (p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height){
            if (isPaused === true) {
                p.userStartAudio();
                sound.play();
                isPaused = false;
            } else {
                sound.pause();
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

    function updateParagraph(){
        let t = sound.currentTime();
        if(index < transcript.length){
            if(t >= transcript[index].time){
                paragraph += transcript[index].text + " ";
                index++;
            }

        }
    }

    p.windowResized = function() {
        let w = container.offsetWidth;
        let h = container.offsetHeight;
        p.resizeCanvas(w, h);
    };
}

new p5(sketch5, 'sketch5');