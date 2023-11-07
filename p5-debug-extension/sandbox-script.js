window.addEventListener('message', async function (event) {

    let newData = `${event.data.trim().replace(/[\u200B-\u200D\uFEFF]/g, '')}`
    // let data2 = data.trim().replace(/[\u200B-\u200D\uFEFF]/g, '').split(/[\s,\t,\n]+/).join(' ');
    
    // console.log(newData);
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

