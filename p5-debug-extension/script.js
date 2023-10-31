let newVarValue;

window.onload = () => {
    let submitBtn = document.getElementById('submit-btn');

    submitBtn.addEventListener('click', (tab)=> {
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
        newVarValue.innerText = request.message;
      }
        
    }
  );