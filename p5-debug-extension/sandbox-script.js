/*

WORKING: Step forward, step back, play/pause, jump to frame, reset sketch

FLAWS + TODO:
->  in content-script.js, separates p5Setup (actual setup function) when createCanvas is called. 
    Should ideally ONLY have createCanvas in setup and call everything else in p5Setup.
->  cannot read from multiple .js files or any packages delivered via cdn, accessing other files via click event dispatch works but also force closes extension
    (see content-script.js - parseFileCode, getAllJsFiles, getJsCode)
    Should ideally have everything run as iframe in the webpage itself and do away with the extension's popup itself
        -> how to deal with video/image files?
->  Stepping back is currently very slow/inefficient with bigger projects, not sure how to optimize without insane memory usage
->  implement variable tracking (create new HTML element every time a variable is declared in code?)
->  integrate Eunice's openai stuff
->  make everything look pretty

*/

window.addEventListener('message', async function (event) {

    let newData = `${event.data.trim().replace(/[\u200B-\u200D\uFEFF]/g, '')}`

    let frameCounter = 0
    let fps = 5
    let sketchPlaying = false;

    let drawLoop = function () {
        console.log('loopin');
        p5Draw();
        frameCounter++;
        frameDisplay.textContent = `Frame Number: ${frameCounter}`;
        if(sketchPlaying) {
            setTimeout(drawLoop, Math.floor(1000/fps));
        }
    };

    let sketchFps = document.getElementById('sketch-fps');
    let frameDisplay = document.getElementById('frame-display');

    sketchFps.addEventListener('input', ()=> {
        fps = sketchFps.value;
        console.log(sketchFps.value);
        document.getElementById('fps-display').innerText = `FPS: ${fps}`;
    })

    document.getElementById('prev-frame-btn').addEventListener('click', ()=> {
        if(sketchPlaying) return;

        p5Setup();
        frameCounter--;
        frameDisplay.textContent = `Frame Number: ${Math.max(0, frameCounter)}`;
        for(let i = 0; i < frameCounter; i++) {
            p5Draw();
        }
    })
    document.getElementById('next-frame-btn').addEventListener('click', ()=> {
        if(sketchPlaying) return;

        p5Draw();
        frameCounter++;
        frameDisplay.textContent = `Frame Number: ${frameCounter}`;
    })
    document.getElementById('play-pause-btn').addEventListener('click', ()=> {
        if(sketchPlaying) {
            sketchPlaying = false;
            console.log('no longer playing');
            document.getElementById('play-pause-btn').textContent = '\u25BA';
        } else {
            sketchPlaying = true;
            console.log('now playing');
            drawLoop();
            document.getElementById('play-pause-btn').textContent = '\u23F8'
        }
    })

    document.getElementById('reset-btn').addEventListener('click', ()=> {

        sketchPlaying = false;
        document.getElementById('play-pause-btn').textContent = 'Play';

        setTimeout(()=>{
            p5Setup();
            frameCounter = 0;
            frameDisplay.textContent = `Frame Number: ${frameCounter}`;
        }, Math.floor(1000/fps) + 1);
        
    })

    document.getElementById('jump-btn').addEventListener('click', ()=> {

        let newFrame = parseInt(document.getElementById('jump-input').value);
        document.getElementById('jump-input').value = ``;
        if(isNaN(newFrame)) return;

        frameCounter = newFrame;

        p5Setup();
        frameDisplay.textContent = `Frame Number: ${frameCounter}`;
        for(let i = 0; i < frameCounter; i++) {
            p5Draw();
        }
    })
    // Nov 25 testing
    //console.log("raw New Data: ", newData)
    // console.log("code list data ", codeList(newData))
    // let func_ends = findFuncEnds(newData)
    // console.log("findFuncEnds Function returns: ", func_ends)
    //testing adding function to end of sketch
    let codeLines = codeList(newData)
    newData = insertHere("  console.log('here is new function placeholder lalala');", codeLines, 'drawLoopEnd')
    console.log(newData)


    
    // // ----- start ----- these lines allow injecting to the start of the draw loop
    // console.log(newData);
    // let codeLines = codeList(newData)
    // newData = insertDrawStart("  console.log(x);", codeLines)
    // console.log(newData)
    // // ----- end -----

    let customNoiseSeed = Math.floor(Math.random() * 1000)
    let customRandomSeed = Math.floor(Math.random() * 1000)
    let noDrawScript = newData.replace(`function draw`, `function p5Draw`).replace(`function p5Setup(){`, `function p5Setup(){noiseSeed(${customNoiseSeed});randomSeed(${customRandomSeed});`);


    console.log(noDrawScript);

    var newScript = document.createElement("script");
    newScript.text = noDrawScript;
    newScript.async = false;
    newScript.id = 'sketch';

    var newScript2 = document.createElement("script");
    newScript2.src = 'p5.min.js';
    newScript2.async = false;
    newScript2.id = 'p5';

    document.body.appendChild(newScript);
    document.body.appendChild(newScript2);

});

//generate a list holding each line of the code in newData
function codeList(data) {
    let codeLines = data.split("\n") //split based on "\n"
    return codeLines
}

function findFuncEnds(data) {
    let codeArr = data

    const drawLine = "function draw()"
    const setupLine = "function p5Setup()"
    let currLineCount = 0
    let drawLoopEnd;
    let setupEnd;
    let sketchEnd = codeArr.length + 1;
    let drawBracketCount = -1;
    let setupBracketCount = -1;

    for(let line of codeArr) {
        if(line.includes(drawLine)){
            drawBracketCount = 0;
            console.log("----START OF DRAW LOOP RIGHT HERE: Line " + currLineCount);
        }
        if(line.includes(setupLine)){
            setupBracketCount = 0
        }
        
        // for finding end of draw function
        if(drawBracketCount != -1) {
            for(let char of line) {
                if(char === "{") drawBracketCount++;
                else if(char === "}") {
                    if(--drawBracketCount == 0) {
                        console.log("----END OF DRAW LOOP RIGHT HERE: Line " + currLineCount);
                        drawBracketCount = -1;
                        drawLoopEnd = currLineCount;
                    }
                }
            }
        }
        // for finding end of setup function
        if(setupBracketCount != -1) {
            for(let char of line) {
                if(char === "{") setupBracketCount++;
                else if(char === "}") {
                    if(--setupBracketCount == 0) {
                        console.log("----END OF SETUP LOOP RIGHT HERE: Line " + currLineCount);
                        setupBracketCount = -1;
                        setupEnd = currLineCount;
                    }
                }
            }
        }
        currLineCount++;
    }
    return {drawLoopEnd: drawLoopEnd, setupEnd: setupEnd, sketchEnd: sketchEnd};
    }

function isLineNumber(str) {
    return !isNaN(parseInt(str));
}

function insertHere(str, codeLines, location){
    // location: str that represents location to insert (i.e 'drawLoopEnd', 'sketchEnd', 'setupEnd',)
    // console.log('inserting ' + str);
    let insertIndex = findFuncEnds(codeLines)[location];
    // console.log("location: ", insertIndex)
    codeLines.splice(insertIndex, 0, str)
    return codeLines.join("\n")
}

function findDrawStart(codeLines) {
    const setupLine = "function draw()"

    for (i=0;i<codeLines.length;i++){
        if (codeLines[i].includes(setupLine)){
            return i+1;
        }
    }
}

function insertDrawStart(str, codeLines) {
    // console.log('inserting ' + str);
    let insertIndex = findDrawStart(codeLines);
    codeLines.splice(insertIndex, 0, str)
    return codeLines.join("\n")
}