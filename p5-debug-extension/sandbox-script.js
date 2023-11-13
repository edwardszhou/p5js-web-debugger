window.addEventListener('message', async function (event) {

    let newData = `${event.data.trim().replace(/[\u200B-\u200D\uFEFF]/g, '')}`
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

    var newScript = document.createElement("script");
    newScript.text = newData;
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