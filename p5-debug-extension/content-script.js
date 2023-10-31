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


chrome.runtime.onMessage.addListener( function(req, sender, sendResponse) {
    console.log('received')
    if(req.varName) {
        highlightVars(req.varName);
        insertDrawEnd("console.log(\'DEBUGTRACK: " + req.varName + ": \' + " + req.varName + ")");

        var consoleObserver = new MutationObserver(observeConsole);
        consoleObserver.observe(document.getElementsByClassName('preview-console__messages')[0].firstChild, {childList: true});
        sendResponse({highlighted:true});
    } else {
        sendResponse({highlighted:false});
    }

});

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
        console.log("hi");
        codeMirrorContainer.dispatchEvent(new KeyboardEvent('keydown', {'bubbles': true, 'code': 'ArrowDown', 'key': 'ArrowDown', 'keyCode':40, 'ctrlKey': true}));
    }
}

function insertCode(str) {
    let codeMirrorContainer = document.getElementsByClassName('CodeMirror-code')[0]
    for(let char of str) {
        codeMirrorContainer.dispatchEvent(new KeyboardEvent('keypress',{'key': char, 'bubbles': true, 'charCode':char.charCodeAt(0)}));
    }
}

function findEndOfDraw(str) {
    codeArr = str.split('\n');

    const drawLine = "function draw() {"
    let maxLineNumber = 0;
    let drawLoopEnd;
    let bracketCount = -1;


    for(let line of codeArr) {
        if(isLineNumber(line)) {
            maxLineNumber = parseInt(line);
            // console.log("LINE NUMBER: " + maxLineNumber);
        } else if (line.replace(/\s/g, "") === drawLine.replaceAll(/\s/g,"")) {
            bracketCount = 0;
            // console.log("THIS IS FUNCTION DRAW RIGHT HERE: " + line);
        }
        else {
            // console.log(bracketCount + " brackets");
            // console.log("This is a line: " + line);
        }

        if(bracketCount != -1) {
            for(let char of line) {
                if(char === "{") bracketCount++;
                else if(char === "}") {
                    if(--bracketCount == 0) {
                        // console.log("----END OF DRAW LOOP RIGHT HERE: Line " + maxLineNumber);
                        bracketCount = -1;
                        drawLoopEnd = maxLineNumber;
                    }
                }
            }
        }
    }
    return {maxLineNumber: maxLineNumber, drawLoopEnd: drawLoopEnd};
}

function isLineNumber(str) {
    return !isNaN(parseInt(str));
}

function insertDrawEnd(str) {
    console.log('inserting ' + str);
    let codeMirrorContainer = document.getElementsByClassName('CodeMirror-code')[0]
    let lineInfo = findEndOfDraw(codeMirrorContainer.innerText);
    

    keyAction("PGDOWN");
    keyAction("HOME");
    for(let i = 0; i < lineInfo.maxLineNumber - lineInfo.drawLoopEnd; i++) {
        keyAction("UP");
    }
    keyAction("NEWLINE");

    insertCode(str);
    keyAction("NEWLINE");
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
                // do something with response here, not outside the function
                console.log(response);
              })();
        }
    }
}
