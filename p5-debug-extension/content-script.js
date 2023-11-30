
// return highlighting

// document.body.addEventListener('keydown', (e)=> {
//     if(e.altKey) {
//         let keywords = document.getElementsByClassName('cm-keyword');
//         for(let word of keywords) {
//             if(word.textContent == "return") {
//                 word.classList.add("bright-red");
//             }
//         }
//     }
// });

// document.body.addEventListener('keyup', ()=> {
//     for(let word of document.getElementsByClassName('bright-red')) {
//         word.classList.remove('bright-red');
//     }
// })

// function highlightVars(response) {
//     let vars = document.getElementsByClassName('cm-variable');
//     for(let word of vars) {
//         if(word.textContent == response) {
//             word.classList.add("bright-red");
//         }
//     }
//     let defs = document.getElementsByClassName('cm-def');
//     for(let word of defs) {
//         if(word.textContent == response) {
//             word.classList.add("bright-red");
//         }
//     }
// }

// communication with popup

chrome.runtime.onMessage.addListener( function(req, sender, sendResponse) {
    console.log('received')
    if(req.varName) {
        // highlightVars(req.varName);
        // insertSetupEnd("frameRate(0.5)");
        // insertDrawEnd("console.log(\'DEBUGTRACK: Loop #\' + frameCount + \': " + req.varName + " = \' + " + req.varName + ")");
        // // this allows for pressing spacebar to pause/play each frame!
        // insertLoopControl("function keyPressed() {if (keyCode === 32) {loop();setTimeout(noLoop(), 100)}}")
        // clickPlay();
        // clickCanvas();

        // var consoleObserver = new MutationObserver(observeConsole);
        // consoleObserver.observe(document.getElementsByClassName('preview-console__messages')[0].firstChild, {childList: true});
        // sendResponse({highlighted:true});
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

window.onload = () => {
    setTimeout(modifyToolbar, 500); // loads new button a bit after window load since p5 apparently has a loading screen
}

function modifyToolbar() {
    let toolbar = document.getElementsByClassName('toolbar')[0]; // inserts in existing toolbar
    let prefBtn = toolbar.lastChild;
    prefBtn.id = "pref-btn";
    
    let debugBtn = document.createElement('button');
    debugBtn.id = "debug-btn";
    debugBtn.ariaLabel = "Open Debug";
    debugBtn.title = "Open Debug";

    // debug icon
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.setAttribute('width', '20px');
    svg.setAttribute('height', '20px');
    svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
    path.setAttribute('d', 'M 19.960938 11.394531 C 19.960938 11.609375 19.882812 11.796875 19.726562 11.953125 C 19.566406 12.113281 19.382812 12.191406 19.164062 12.191406 L 16.375 12.191406 C 16.375 13.613281 16.097656 14.816406 15.542969 15.804688 L 18.132812 18.40625 C 18.289062 18.5625 18.367188 18.75 18.367188 18.964844 C 18.367188 19.183594 18.289062 19.367188 18.132812 19.527344 C 17.980469 19.683594 17.796875 19.761719 17.570312 19.761719 C 17.347656 19.761719 17.160156 19.683594 17.011719 19.527344 L 14.546875 17.074219 C 14.503906 17.113281 14.441406 17.167969 14.359375 17.234375 C 14.277344 17.300781 14.101562 17.421875 13.835938 17.589844 C 13.570312 17.761719 13.300781 17.910156 13.027344 18.042969 C 12.753906 18.175781 12.410156 18.296875 12.003906 18.40625 C 11.597656 18.511719 11.195312 18.566406 10.796875 18.566406 L 10.796875 7.410156 L 9.203125 7.410156 L 9.203125 18.566406 C 8.78125 18.566406 8.359375 18.511719 7.9375 18.398438 C 7.519531 18.289062 7.160156 18.148438 6.855469 17.988281 C 6.550781 17.828125 6.277344 17.664062 6.035156 17.503906 C 5.789062 17.339844 5.609375 17.207031 5.492188 17.097656 L 5.304688 16.921875 L 3.027344 19.5 C 2.859375 19.675781 2.660156 19.761719 2.429688 19.761719 C 2.230469 19.761719 2.050781 19.695312 1.894531 19.5625 C 1.734375 19.414062 1.648438 19.230469 1.636719 19.007812 C 1.625 18.789062 1.691406 18.597656 1.832031 18.429688 L 4.347656 15.605469 C 3.863281 14.65625 3.625 13.519531 3.625 12.191406 L 0.835938 12.191406 C 0.617188 12.191406 0.433594 12.113281 0.273438 11.953125 C 0.117188 11.796875 0.0390625 11.609375 0.0390625 11.394531 C 0.0390625 11.179688 0.117188 10.992188 0.273438 10.835938 C 0.433594 10.675781 0.617188 10.597656 0.835938 10.597656 L 3.625 10.597656 L 3.625 6.9375 L 1.46875 4.78125 C 1.3125 4.625 1.234375 4.4375 1.234375 4.222656 C 1.234375 4.007812 1.3125 3.820312 1.46875 3.660156 C 1.628906 3.503906 1.8125 3.425781 2.03125 3.425781 C 2.246094 3.425781 2.433594 3.503906 2.589844 3.660156 L 4.746094 5.816406 L 15.253906 5.816406 L 17.410156 3.660156 C 17.566406 3.503906 17.753906 3.425781 17.96875 3.425781 C 18.1875 3.425781 18.371094 3.503906 18.53125 3.660156 C 18.6875 3.820312 18.765625 4.007812 18.765625 4.222656 C 18.765625 4.4375 18.6875 4.625 18.53125 4.78125 L 16.375 6.9375 L 16.375 10.597656 L 19.164062 10.597656 C 19.382812 10.597656 19.566406 10.675781 19.726562 10.835938 C 19.882812 10.992188 19.960938 11.179688 19.960938 11.394531 Z M 13.984375 4.222656 L 6.015625 4.222656 C 6.015625 3.117188 6.402344 2.175781 7.179688 1.402344 C 7.957031 0.625 8.894531 0.238281 10 0.238281 C 11.105469 0.238281 12.042969 0.625 12.820312 1.402344 C 13.597656 2.175781 13.984375 3.117188 13.984375 4.222656 Z M 13.984375 4.222656');
    svg.appendChild(path);
    debugBtn.appendChild(svg);

    toolbar.insertBefore(debugBtn, prefBtn);

    // creates modal elements
    debugBtn.addEventListener('click', function() {
        let overlay = document.createElement('div');
        let overlayContent = document.createElement('div');
        let popup = document.createElement('section');
        let popupHeader = document.createElement('header');
        let popupTitle = document.createElement('h2');
        let popupClose = document.createElement('button');

        overlay.className = "custom-overlay";
        overlayContent.className = "custom-overlay-content";
        popup.className = "popup";
        popupHeader.className = "popup-header";
        popupTitle.className = "popup-title";
        popupClose.className = "popup-close";

        let xSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        let xPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        xSvg.setAttribute('width', '16px');
        xSvg.setAttribute('height', '16px');
        xSvg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
        xPath.setAttribute('d', 'M8,5.87867966 L2.69669914,0.575378798 L0.575378798,2.69669914 L5.87867966,8 L0.575378798,13.3033009 L2.69669914,15.4246212 L8,10.1213203 L13.3033009,15.4246212 L15.4246212,13.3033009 L10.1213203,8 L15.4246212,2.69669914 L13.3033009,0.575378798 L8,5.87867966 Z');
        xSvg.appendChild(xPath);

        popupTitle.textContent = "p5 Debug Mode";
        overlay.appendChild(overlayContent);
        overlayContent.appendChild(popup);
        popup.appendChild(popupHeader);
        popupHeader.appendChild(popupTitle);
        popupHeader.appendChild(popupClose);
        popupClose.appendChild(xSvg);

        // INSERT IFRAME INTO POPUP
        let sketchContainer = document.createElement('iframe');
        sketchContainer.src = chrome.runtime.getURL(`sandbox.html`);
        sketchContainer.id = 'sandbox';
        sketchContainer.width = '100%';
        sketchContainer.height = '100%';
        popup.appendChild(sketchContainer);

        // adds modal to root page
        document.getElementsByClassName('editor-preview-container')[0].parentElement.appendChild(overlay);

        // waits til iframe is loaded
        sketchContainer.addEventListener('load', ()=> {
            let jsCode = getJsCode(getAllJsFiles()); // gets all code, sends to iframe
            sketchContainer.contentWindow.postMessage(jsCode, "*");
        })

        // removes modal to root page on popup close
        popupClose.addEventListener('click', function() {
            document.getElementsByClassName('editor-preview-container')[0].parentElement.removeChild(overlay);
        });
    })
}
