window.onload = () => {
    let runSketchBtn = document.getElementById('run-sketch-btn');

    runSketchBtn.addEventListener('click', ()=> {
        (async () => {
            const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
            await chrome.tabs.sendMessage(tab.id, {type: 'initiate'});
          })();
    })


}
