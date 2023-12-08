/*

TODO:
->  how to deal with CDNs, videos, images?
->  user interaction
->  integrate Eunice's openai stuff
->  line by line step

*/

let trackedVars = [];
var P5DEBUG__canvas;

window.addEventListener('message', async function (event) {

    let code = event.data.code;
    let links = event.data.links;

    let newData = `${code.trim().replace(/[\u200B-\u200D\uFEFF]/g, '')}`
    newData = transform_code(newData.split('\n'), key_pattern, global_pattern).join('\n');

    let frameCounter = 0
    let fps = 5
    let sketchPlaying = false;

    let drawLoop = function () {
        P5DEBUG__draw();
        displayVariables();
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
        document.getElementById('fps-display').innerText = `FPS: ${fps}`;
    })

    document.getElementById('prev-frame-btn').addEventListener('click', stepBackward);
    document.getElementById('next-frame-btn').addEventListener('click', stepForward)
    document.getElementById('play-pause-btn').addEventListener('click', toggleSketchPlay);
    document.getElementById('reset-btn').addEventListener('click', resetSketch);
    document.getElementById('jump-btn').addEventListener('click', ()=> {
        let newFrame = parseInt(document.getElementById('jump-input').value);
        jumpToFrame(newFrame);
    })

    let customNoiseSeed = Math.floor(Math.random() * 1000)
    let customRandomSeed = Math.floor(Math.random() * 1000)
    let noDrawScript = newData.replace(`P5DEBUG__NOISESEED`, `${customNoiseSeed}`).replace(`P5DEBUG__RANDOMSEED`, `${customRandomSeed}`);

    console.log(noDrawScript);
    loadSketch([noDrawScript, links]);

    let varSubmitBtn = document.getElementById('variable-submit-btn');
    varSubmitBtn.addEventListener('click', ()=> {

        let varToTrack = document.getElementById('variable-input').value;

        if(!checkVarInput(varToTrack)) return;

        let newVarContainer = document.createElement('div');
        let newVarNameSpan = document.createElement('span');
        let newVarContentSpan = document.createElement('span');

        newVarContainer.className = "tracked-variable";
        newVarNameSpan.className = "tracked-var-name";
        newVarContentSpan.className = "tracked-var-content";

        let allVarsContainer = document.getElementsByClassName('variable-container')[0];

        let newVarString;

        try {
            newVarString = eval(`JSON.stringify(${varToTrack}, null, "--> ")`);
        } catch (error) {
            newVarString = '[UNSUPPORTED TYPE]'
            newVarContainer.style.backgroundColor = 'rgb(255, 225, 225)';
            newVarContainer.style.color = 'rgb(209, 21, 24)';
        }

        newVarNameSpan.innerText = `${varToTrack}: `;
        newVarContentSpan.innerText = `${newVarString}`;
        newVarContainer.appendChild(newVarNameSpan);
        newVarContainer.appendChild(newVarContentSpan);

        allVarsContainer.appendChild(newVarContainer);

        newVarContainer.addEventListener('click', ()=> {
            allVarsContainer.removeChild(newVarContainer);
            for(let i = 0; i < trackedVars.length; i++) {
                let variable = trackedVars[i]
                if(variable.container == newVarContainer) {
                    trackedVars.splice(i, 1);
                }
            }
        })
        trackedVars.push({name: varToTrack, container: newVarContainer});

        document.getElementById('variable-input').value = "";
    })

    function stepForward() {
        if(sketchPlaying) return;

        P5DEBUG__draw();
        displayVariables();
        
        frameCounter++;
        frameDisplay.textContent = `Frame Number: ${frameCounter}`;
    }
    function stepBackward() {
        if(sketchPlaying) return;

        P5DEBUG__setup();
        frameCounter--;
        frameDisplay.textContent = `Frame Number: ${Math.max(0, frameCounter)}`;
        for(let i = 0; i < frameCounter; i++) {
            P5DEBUG__draw();
        }
        displayVariables();
    }
    function toggleSketchPlay() {
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
    }
    function resetSketch() {
        sketchPlaying = false;
        document.getElementById('play-pause-btn').textContent = '\u25BA';

        setTimeout(()=>{
            P5DEBUG__setup();
            P5DEBUG__canvas.clear();
            frameCounter = 0;
            frameDisplay.textContent = `Frame Number: ${frameCounter}`;
            displayVariables();
        }, Math.floor(1000/fps) + 1);
    }
    function jumpToFrame(newFrame) {
        document.getElementById('jump-input').value = ``;
        if(isNaN(newFrame)) return;

        frameCounter = newFrame;

        P5DEBUG__setup();
        frameDisplay.textContent = `Frame Number: ${frameCounter}`;
        for(let i = 0; i < frameCounter; i++) {
            P5DEBUG__draw();
            displayVariables();
        }
    }
    function checkVarInput(varToTrack) {
        if(varToTrack.replace(/\s/g, "") == "" || (!noDrawScript.includes("let " + varToTrack) && !noDrawScript.includes("var " + varToTrack))) {
            alert("p5 Debug Error: Variable does not exist");
            return false;
        }

        try {
            eval(varToTrack);
        } catch (error) {
            alert("p5 Debug Error: Variable declared locally, does not exist in global sketch");
            return false;
        }

        for(let variable of trackedVars) {
            if(variable.name == varToTrack) {
                alert("p5 Debug Error: Variable is already tracked");
                return false;
            }
        }

        return true;
    }
});

function loadSketch(scripts) {
    if(document.getElementById('p5')) {
        for(let file of document.getElementsByClassName('p5-debug-js-file')) {
            document.body.remove(file);
        }
    }

    var newScript = document.createElement("script");
    newScript.text = scripts[0];
    newScript.async = false;
    newScript.id = 'sketch';
    newScript.classList += 'p5-debug-js-file';

    var newScript2 = document.createElement("script");
    newScript2.src = 'p5.min.js';
    newScript2.async = false;
    newScript2.id = 'p5';
    newScript2.classList += 'p5-debug-js-file';

    // for(let link of scripts[1]) {
    //     let linkScript = document.createElement("script");
    //     linkScript.src = link;
    //     linkScript.async = false;
    //     linkScript.classList += 'p5-debug-js-file';
    //     document.body.appendChild(linkScript);
    // }

    document.body.appendChild(newScript);
    document.body.appendChild(newScript2);
}

function displayVariables() {
    for(let variable of trackedVars) {

        let varString, err = false;
        try {
            varString = eval(`JSON.stringify(${variable.name}, null, "--> ")`);
        } catch (error) {
            varString = '[UNSUPPORTED TYPE]'
            err = true;
        }
        variable.container.firstChild.innerText = `${variable.name}: `;
        variable.container.firstChild.nextSibling.innerText = `${varString}`;

        if(err) {
            variable.container.style.backgroundColor = 'rgb(255, 225, 225)';
            variable.container.style.color = 'rgb(209, 21, 24)';
        }
    }
}

/*

METHODS BELOW ARE NOT IN USE AS OF 12/8/23

*/
//generate a list holding each line of the code in newData
function codeList(data) {
    let codeLines = data.split("\n") //split based on "\n"
    return codeLines
}

// needs fixing
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

function insertHere(str, codeLines, location){
    // location: str that represents location to insert (i.e 'drawLoopEnd', 'sketchEnd', 'setupEnd',)
    // console.log('inserting ' + str);
    let insertIndex = findFuncEnds(codeLines)[location];
    // console.log("location: ", insertIndex)
    codeLines.splice(insertIndex, 0, str)
    return codeLines.join("\n")
}

// needs fixing
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