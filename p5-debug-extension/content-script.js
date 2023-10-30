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