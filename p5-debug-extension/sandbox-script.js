window.addEventListener('message', async function (event) {

    let newData = `${event.data.trim().replace(/[\u200B-\u200D\uFEFF]/g, '')}`

    window.frameCounter = 0

    // let data2 = data.trim().replace(/[\u200B-\u200D\uFEFF]/g, '').split(/[\s,\t,\n]+/).join(' ');

    // ----- start ----- these lines allow injecting to the start of the draw loop
    console.log(newData);
    let codeLines = codeList(newData)
    newData = insertDrawStart("  background('red');", codeLines)
    console.log(newData)
    // ----- end -----

    // console.log(data2);
    // for(let i = 0; i < newData.length; i++) {
    //     if(newData.charAt(i) != data2.charAt(i)) {
    //         console.log("NOT EQUAL: \"" + newData.charAt(i) + "\" != \"" + data2.charAt(i) + "\"" + i);
    //         console.log(newData.charCodeAt(i))
    //     } else {
    //         console.log("Equal: \"" + newData.charAt(i) + "\" == \"" + data2.charAt(i) + "\"" + i);
    //     }
    // }
    let customNoiseSeed = Math.floor(Math.random() * 1000)
    let customRandomSeed = Math.floor(Math.random() * 1000)
    let noDrawScript = newData.replace(`function draw`, `function p5Draw`).replace(`function p5Setup(){`, `function p5Setup(){noiseSeed(${customNoiseSeed});randomSeed(${customRandomSeed});`);

    // noDrawScript = noDrawScript.replace(`function setup {`, `function setup {noiseSeed(${customNoiseSeed});randomSeed(${customRandomSeed})`);

    noDrawScript += `\nfunction keyPressed(){
        if(keyCode === RIGHT_ARROW) {
            p5Draw();
            window.frameCounter++;
        } else if(keyCode === LEFT_ARROW) {
            p5Setup();
            window.frameCounter--;
            for(let i = 0; i < window.frameCounter; i++) {
                p5Draw();
            }
            
        }\n
    }`

    console.log(noDrawScript);

    var newScript = document.createElement("script");
    newScript.text = noDrawScript;
    newScript.async = false;

    var newScript2 = document.createElement("script");
    newScript2.src = 'p5.min.js';
    newScript2.async = false;

    document.body.appendChild(newScript);
    document.body.appendChild(newScript2);
});

//generate a list holding each line of the code in newData
function codeList(data) {
    let codeLines = data.split("\n") //split based on "\n"
    console.log(codeLines)
    return codeLines
}

function findDrawStart(codeLines) {
    const setupLine = "function draw() {"

    for (i=0;i<codeLines.length;i++){
        if (codeLines[i] == setupLine){
            return i+1
        }
    }
}

function insertDrawStart(str, codeLines) {
    console.log('inserting ' + str);
    let insertIndex = findDrawStart(codeLines);
    codeLines.splice(insertIndex, 0, str)
    return codeLines.join("\n")
}