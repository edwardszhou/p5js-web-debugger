/*

TODO:
->  how to deal with CDNs, videos, images?
->  user interaction
->  integrate Eunice's openai stuff
->  line by line step

*/

let P5DEBUG__trackedVars = [];
var P5DEBUG__canvas;

// loads everything once iframe receives code from tab
window.addEventListener('message', async function (event) {

    let code = event.data.code;
    let links = event.data.links;

    // manipulates code to separate functions and remove extraneous characters
    let newData = `${code.trim().replace(/[\u200B-\u200D\uFEFF]/g, '')}`
    newData = transform_code(newData.split('\n'), key_pattern, global_pattern).join('\n');

    // sketch variables
    let frameCounter = 0
    let fps = 5
    let sketchPlaying = false;

    // new draw loop, calls draw and updates frame counter and variable display, loops if necessary
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

    // updates fps display upon input
    sketchFps.addEventListener('input', ()=> {
        fps = sketchFps.value;
        document.getElementById('fps-display').innerText = `FPS: ${fps}`;
    })

    // adds button event listeners
    document.getElementById('prev-frame-btn').addEventListener('click', stepBackward);
    document.getElementById('next-frame-btn').addEventListener('click', stepForward)
    document.getElementById('play-pause-btn').addEventListener('click', toggleSketchPlay);
    document.getElementById('reset-btn').addEventListener('click', resetSketch);
    document.getElementById('jump-btn').addEventListener('click', ()=> {
        let newFrame = parseInt(document.getElementById('jump-input').value);
        jumpToFrame(newFrame);
    })

    // fixes random and noise seeeds per iframe, allowing stepping backwards and resetting to work
    let customNoiseSeed = Math.floor(Math.random() * 1000)
    let customRandomSeed = Math.floor(Math.random() * 1000)
    let noDrawScript = newData.replace(`P5DEBUG__NOISESEED`, `${customNoiseSeed}`).replace(`P5DEBUG__RANDOMSEED`, `${customRandomSeed}`);

    console.log(noDrawScript);
    
    // loads sketch into iframe
    P5DEBUG__loadSketch([noDrawScript, links]);

    // variable tracking functionality
    let varSubmitBtn = document.getElementById('variable-submit-btn');
    varSubmitBtn.addEventListener('click', ()=> {

        let varToTrack = document.getElementById('variable-input').value;

        if(!checkVarInput(varToTrack)) return;

        // adds variable tracking html
        let newVarContainer = document.createElement('div');
        let newVarNameSpan = document.createElement('span');
        let newVarContentSpan = document.createElement('span');

        newVarContainer.className = "tracked-variable";
        newVarNameSpan.className = "tracked-var-name";
        newVarContentSpan.className = "tracked-var-content";

        let allVarsContainer = document.getElementsByClassName('variable-container')[0];

        let newVarString;

        // formats variable using JSON stringify
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

        // remove variable on click
        newVarContainer.addEventListener('click', ()=> {
            allVarsContainer.removeChild(newVarContainer);
            for(let i = 0; i < P5DEBUG__trackedVars.length; i++) {
                let variable = P5DEBUG__trackedVars[i]
                if(variable.container == newVarContainer) {
                    P5DEBUG__trackedVars.splice(i, 1);
                }
            }
        })
        P5DEBUG__trackedVars.push({name: varToTrack, container: newVarContainer});

        document.getElementById('variable-input').value = "";
    })

    /**
     * Steps sketch forward, updates variables and frame display
     */
    function stepForward() {
        if(sketchPlaying) return;

        P5DEBUG__draw();
        displayVariables();
        
        frameCounter++;
        frameDisplay.textContent = `Frame Number: ${frameCounter}`;
    }

    /**
     * Steps sketch backward by resetting sketch and calling draw until previous frame, updates variables and frame display
     */
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

    /**
     * Toggles sketch play/pause (automatic calling of draw)
     */
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

    /** 
     * Resets sketch to frame 0
     */
    function resetSketch() {
        sketchPlaying = false;
        document.getElementById('play-pause-btn').textContent = '\u25BA';

        // resets sketch after last frame call
        setTimeout(()=>{
            P5DEBUG__setup();
            P5DEBUG__canvas.clear();
            frameCounter = 0;
            frameDisplay.textContent = `Frame Number: ${frameCounter}`;
            displayVariables();
        }, Math.floor(1000/fps) + 1);
    }

    /**
     * Jumps sketch to specific frame by resetting and calling draw until specified frame
     * 
     * @param {number} newFrame frame to jump to
     */
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

    /**
     * Checks if variable is valid to be added to variable tracker
     * 
     * @param {string} varToTrack variable to test
     * @returns boolean stating validity of variable
     */
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

        for(let variable of P5DEBUG__trackedVars) {
            if(variable.name == varToTrack) {
                alert("p5 Debug Error: Variable is already tracked");
                return false;
            }
        }

        return true;
    }

    /**
     * Updates variable display in variable tracker
     */
    function displayVariables() {
        for(let variable of P5DEBUG__trackedVars) {

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
});

/**
 * Loads sketch into iframe along with p5.js file
 * 
 * @param {array} scripts array containing javascript and list of cdns
 */
function P5DEBUG__loadSketch(scripts) {

    // removes existing files
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

    // LOADING CDNS BLOCKED BY CHROME SECURITY
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


/*

METHODS BELOW ARE NOT IN USE AS OF 12/8/23

*/
//generate a list holding each line of the code in newData
function P5DEBUG__codeList(data) {
    let codeLines = data.split("\n") //split based on "\n"
    return codeLines
}

// needs fixing
function P5DEBUG__findFuncEnds(data) {
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

function P5DEBUG__insertHere(str, codeLines, location){
    // location: str that represents location to insert (i.e 'drawLoopEnd', 'sketchEnd', 'setupEnd',)
    // console.log('inserting ' + str);
    let insertIndex = findFuncEnds(codeLines)[location];
    // console.log("location: ", insertIndex)
    codeLines.splice(insertIndex, 0, str)
    return codeLines.join("\n")
}

// needs fixing
function P5DEBUG__findDrawStart(codeLines) {
    const setupLine = "function draw()"

    for (i=0;i<codeLines.length;i++){
        if (codeLines[i].includes(setupLine)){
            return i+1;
        }
    }
}

function P5DEBUG__insertDrawStart(str, codeLines) {
    // console.log('inserting ' + str);
    let insertIndex = findDrawStart(codeLines);
    codeLines.splice(insertIndex, 0, str)
    return codeLines.join("\n")
}
