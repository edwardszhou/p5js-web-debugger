
// return highlighting
document.body.addEventListener('keydown', (e)=> {
    if(e.altKey) {
        let keywords = document.getElementsByClassName('cm-keyword');
        for(let word of keywords) {
            if(word.textContent == "return") {
                word.classList.add("bright-red");
            }
        }
    }
});

document.body.addEventListener('keyup', ()=> {
    for(let word of document.getElementsByClassName('bright-red')) {
        word.classList.remove('bright-red');
    }
})

function highlightVars(response) {
    let vars = document.getElementsByClassName('cm-variable');
    for(let word of vars) {
        if(word.textContent == response) {
            word.classList.add("bright-red");
        }
    }
    let defs = document.getElementsByClassName('cm-def');
    for(let word of defs) {
        if(word.textContent == response) {
            word.classList.add("bright-red");
        }
    }
}

// communication with popup
chrome.runtime.onMessage.addListener( function(req, sender, sendResponse) {
    console.log('received')
    if(req.varName) {
        highlightVars(req.varName);
        insertSetupEnd("frameRate(0.5)");
        insertDrawEnd("console.log(\'DEBUGTRACK: Loop #\' + frameCount + \': " + req.varName + " = \' + " + req.varName + ")");
        // this allows for pressing spacebar to pause/play each frame!
        insertLoopControl("function keyPressed() {if (keyCode === 32) {loop();setTimeout(noLoop(), 100)}}")
        clickPlay();
        clickCanvas();

        var consoleObserver = new MutationObserver(observeConsole);
        consoleObserver.observe(document.getElementsByClassName('preview-console__messages')[0].firstChild, {childList: true});
        sendResponse({highlighted:true});
    } else if (req.type == 'runSketch'){
        // console.log('message 1 received')
        // console.log(getAllJsFiles());
        // let code = getJsCode(['sketch.js']);
        // chrome.runtime.sendMessage({jsCode: code});
        // console.log('message 2 received')
        sendJsCode(parseFileCode('sketch.js'));
        // sendResponse({string: code });
        
    }

});

// manipulate window via event dispatch
function keyAction(action) {
    let codeMirrorContainer = document.getElementsByClassName('CodeMirror-code')[0]
    if(action == "NEWLINE") {
        codeMirrorContainer.dispatchEvent(new KeyboardEvent('keydown', {'bubbles': true, 'code': 'Enter', 'key': 'Enter', 'keyCode':13}));
    }
    else if(action == "DOWN") {
        codeMirrorContainer.dispatchEvent(new KeyboardEvent('keydown', {'bubbles': true, 'code': 'ArrowDown', 'key': 'ArrowDown', 'keyCode':40}));
    }
    else if(action == "UP") {
        codeMirrorContainer.dispatchEvent(new KeyboardEvent('keydown', {'bubbles': true, 'code': 'ArrowUp', 'key': 'ArrowUp', 'keyCode':38}));
    }
    else if(action == "HOME") {
        codeMirrorContainer.dispatchEvent(new KeyboardEvent('keydown', {'bubbles': true, 'code': 'Home', 'key': 'Home', 'keyCode':36}));
    }
    else if(action == "END") {
        codeMirrorContainer.dispatchEvent(new KeyboardEvent('keydown', {'bubbles': true, 'code': 'End', 'key': 'End', 'keyCode':35}));
    }
    else if(action == "PGDOWN") {
        codeMirrorContainer.dispatchEvent(new KeyboardEvent('keydown', {'bubbles': true, 'code': 'ArrowDown', 'key': 'ArrowDown', 'keyCode':40, 'ctrlKey': true}));
    }
    else if(action == "PGUP") {
        codeMirrorContainer.dispatchEvent(new KeyboardEvent('keydown', {'bubbles': true, 'code': 'ArrowUp', 'key': 'ArrowUp', 'keyCode':38, 'ctrlKey': true}));
    }
}

function insertCode(str) {
    let codeMirrorContainer = document.getElementsByClassName('CodeMirror-code')[0]
    for(let char of str) {
        codeMirrorContainer.dispatchEvent(new KeyboardEvent('keypress',{'key': char, 'bubbles': true, 'charCode':char.charCodeAt(0)}));
    }
}

// NEEDS FIXING (SIMILAR TO parseEditorCode) TO READ ALL CODE
function findFuncEnds() {
    let codeMirrorContainer = document.getElementsByClassName('CodeMirror-code')[0];
    let codeArr = codeMirrorContainer.innerText.split('\n');

    const drawLine = "function draw() {"
    const setupLine = "function setup() {"
    let maxLineNumber = 0;
    let drawLoopEnd;
    let setupEnd;
    let sketchEnd;
    let drawBracketCount = -1;
    let setupBracketCount = -1;


    for(let line of codeArr) {
        if(isLineNumber(line)) {
            maxLineNumber = parseInt(line);
            console.log("LINE NUMBER: " + maxLineNumber);
        } else if (line.replace(/\s/g, "") === drawLine.replaceAll(/\s/g,"")) {
            drawBracketCount = 0;
            console.log("THIS IS FUNCTION DRAW RIGHT HERE: " + line);
        }
        else if(line.replace(/\s/g, "") === setupLine.replaceAll(/\s/g,"")){
            setupBracketCount = 0;
            console.log(setupBracketCount + " brackets");
            console.log("This is a line: " + line);
        }

        if(drawBracketCount != -1) {
            for(let char of line) {
                if(char === "{") drawBracketCount++;
                else if(char === "}") {
                    if(--drawBracketCount == 0) {
                        console.log("----END OF DRAW LOOP RIGHT HERE: Line " + maxLineNumber);
                        drawBracketCount = -1;
                        drawLoopEnd = maxLineNumber;
                        sketchEnd = maxLineNumber + 1;
                    }
                }
            }
        }
        if(setupBracketCount != -1) {
            for(let char of line) {
                if(char === "{") setupBracketCount++;
                else if(char === "}") {
                    if(--setupBracketCount == 0) {
                        console.log("----END OF SETUP LOOP RIGHT HERE: Line " + maxLineNumber);
                        setupBracketCount = -1;
                        setupEnd = maxLineNumber;
                    }
                }
            }
        }
    }
    return {maxLineNumber: maxLineNumber, drawLoopEnd: drawLoopEnd, setupEnd: setupEnd, sketchEnd: sketchEnd};
}

function isLineNumber(str) {
    return !isNaN(parseInt(str));
}

function insertDrawEnd(str) {
    console.log('inserting ' + str);
    let lineInfo = findFuncEnds();
    

    keyAction("PGDOWN");
    keyAction("HOME");
    for(let i = 0; i < lineInfo.maxLineNumber - lineInfo.drawLoopEnd; i++) {
        keyAction("UP");
        keyAction("HOME");
    }
    keyAction("NEWLINE");

    insertCode(str);
    keyAction("NEWLINE");
}

function insertSetupEnd(str) {
    console.log('inserting ' + str);
    let lineInfo = findFuncEnds();
    

    keyAction("PGDOWN");
    keyAction("HOME");
    for(let i = 0; i < lineInfo.maxLineNumber - lineInfo.setupEnd; i++) {
        keyAction("UP");
        keyAction("HOME");
    }
    keyAction("NEWLINE");

    insertCode(str);
    keyAction("NEWLINE");
}

function insertLoopControl(str) {
    console.log('inserting ' + str);
    let codeMirrorContainer = document.getElementsByClassName('CodeMirror-code')[0]
    let lineInfo = findEndOfDraw(codeMirrorContainer.innerText);
    
    // if we still make it find the spot right under drawLoopEnd, then we can easily have it delete everything older/repeated under?
    keyAction("PGDOWN");
    keyAction("HOME");
    for(let i = 0; i < lineInfo.maxLineNumber - lineInfo.sketchEnd; i++) {
        keyAction("UP");
        keyAction("HOME");
    }
    keyAction("NEWLINE");

    insertCode(str);
    keyAction("NEWLINE");

}

function clickPlay() {
    let playBtn = document.getElementsByClassName("toolbar__play-button")[0]
    playBtn.dispatchEvent(new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
    }));
}

// console reading
function clickCanvas() {
    let canvasContainer = document.getElementsByClassName("preview-frame__content")[0]
    canvasContainer.dispatchEvent(new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
    }));
    console.log("canvas clicked!")
}

function readLastConsoleMessage() {
    let consoleContainer = document.getElementsByClassName('preview-console__messages')[0];
    if(consoleContainer.firstChild.lastChild) {
        return consoleContainer.firstChild.lastChild.innerText;
    }
}

var observeConsole = function(mutationsList) {
    for(let mutation of mutationsList) {
        if (mutation.type == 'childList') {
            console.log("change detected");
            let message = readLastConsoleMessage();
            (async () => {
                const response = await chrome.runtime.sendMessage({message: message});
                console.log(response);
              })();
        }
    }
}

// getting editor code
function parseFileCode(fileName) {

    let files = document.getElementsByClassName("sidebar__file-item-name");
    let fileFound = false;
    for(let file of files) {
        if(file.textContent == fileName) {
            file.dispatchEvent(new MouseEvent("click", {
                view: window,
                bubbles: true,
                cancelable: true,
                preventDefault: true
            }));
            fileFound = true;
            break;
        }
    }
    if(!fileFound) {
        throw new Error("File not found in p5 editor");
    }

    let lastLineNum = -1;
    let newCode = `\n`;

    keyAction("PGDOWN");
    keyAction("HOME");
    while(lastLineNum != 1) {
        let lineContent = document.getElementsByClassName('CodeMirror-activeline')[0].innerText.split('\n')
        lastLineNum = parseInt(lineContent[0])
        
        if(!lineContent[1].includes('createCanvas')) { // DOES NOT INCLUDE CREATE CANVAS
            newCode = lineContent[1] + `\n` + newCode;
        } else {
            newCode = lineContent[1] + `\np5Setup();} function p5Setup(){\n` + newCode
        }
        
        keyAction("UP");
        keyAction("HOME");
    }
    
    return newCode;
    
}

function getAllJsFiles() {
    let files = document.getElementsByClassName("sidebar__file-item-name");

    for(let file of files) {
        if(file.textContent == "index.html") {
            file.dispatchEvent(new MouseEvent("click", {
                view: window,
                bubbles: true,
                cancelable: true,
                preventDefault: true
            }));
            break;
        }
    }

    keyAction("PGDOWN");
    keyAction("HOME");

    let lastLineNum = -1;
    let jsFiles = [];

    while(lastLineNum != 1) {
        let lineContent = document.getElementsByClassName('CodeMirror-activeline')[0].innerText.split('\n')
        lastLineNum = parseInt(lineContent[0])
        if(lineContent[1].replace(/[\u200B-\u200D\uFEFF]/g, '').includes('.js"></script>')) {
            // console.log(lineContent.split('"'))
            jsFiles.push(lineContent[1].split('"')[1])
        }

        keyAction("UP");
        keyAction("HOME");
    }

    return jsFiles;
}

function getJsCode(jsFiles) {

    let jsCode = ``

    for(let jsFile of jsFiles) {
        if(jsFile.includes("https://")){
            // console.log("Not searched: " + jsFile)
            continue;
        } 
        jsCode += parseFileCode(jsFile);
    }

    // console.log(jsCode)

    return jsCode;

}

async function sendJsCode(str) {
    await chrome.runtime.sendMessage({jsCode: str});
}