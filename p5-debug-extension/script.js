let newVarValue;

window.onload = () => {
    let submitBtn = document.getElementById('submit-btn');
    let runSketchBtn = document.getElementById('run-sketch-btn');

    submitBtn.addEventListener('click', ()=> {
        console.log('clicked');
    
        let inputText = document.getElementById('variable-input').value;
        (async () => {
            const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
            const response = await chrome.tabs.sendMessage(tab.id, {varName: inputText});
            console.log(response);
          })();
        
        let newVarParagraph = document.createElement('p');
        newVarParagraph.innerText = inputText + ": "
        newVarValue = document.createElement('span');

        document.body.appendChild(newVarParagraph);
        newVarParagraph.appendChild(newVarValue);
    })

    runSketchBtn.addEventListener('click', ()=> {
        (async () => {
            const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
            await chrome.tabs.sendMessage(tab.id, {type: 'runSketch'});
            // console.log('message 1 sent')
            // const iframe = document.getElementById('sandbox');
            // iframe.contentWindow.postMessage(response.string, "*");
          })();
    })


}

function highlightVars() {
    
    let vars = document.getElementsByClassName('cm-variable');
    for(let word of vars) {
        if(word.textContent == inputText) {
            word.classList.add("bright-red");
        }
    }
    let defs = document.getElementsByClassName('cm-def');
    for(let word of defs) {
        if(word.textContent == inputText) {
            word.classList.add("bright-red");
        }
    }
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.message && newVarValue){
        newVarValue.innerText = request.message.slice(11);
      }

      if(request.jsCode) {
        console.log('message 2 received')
        const iframe = document.getElementById('sandbox');
        iframe.contentWindow.postMessage(request.jsCode, "*");
      }
        
    }
);

function runSketchMessage() {

}