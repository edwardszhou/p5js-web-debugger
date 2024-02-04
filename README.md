# p5 Debug

Debugging toolset chrome extension for [p5.js web editor](https://editor.p5js.org/)    

Inspired by Processing 3 Debugger ([The Coding Train demo](https://www.youtube.com/watch?v=03WXKb422w0))    

Created by Connie Hu, Edward Zhou, Eunice Pak, and Alex Ali   
   
## Demo

https://github.com/ch3926/p5-web-debugger/assets/123663456/7a9747c3-e844-46a5-a8c6-86d1343cb17f

## How to test extension

Download this reposity as a zip file and unzip on your computer. In order to use the extension in Chrome, navigate to chrome://extensions, turn on developer mode in the upper right corner, and click "load unpacked". From there, select the folder "p5-debug-extension" from within your download. It should work when accessing editor.p5js.org (sometimes it doesn't load or the button doesn't quite work; reloading usually fixes it).


## Features

**Sketch Frame Control**: p5 Debug allows users to control their p5.js sketch by playing or pausing, manually stepping frames forward and backward, or even jumping to a specified frame count.   

**Variable Frame Rate**: Rather than relying on updating p5.js' frameRate() function, p5 Debug allows users to slow down and speed up frame rate on the fly without restarting the sketch.    

**Basic Variable Tracking**: Users can view properties of global variables in each frame as the sketch is updated

## Unsupported features / Next Steps
- External JavaScript libraries (CDNs in index.html)
- p5.js non-JavaScript files in sketch directory (images, videos, etc.)
- Better control over sketch DOM elements
- Breakpoints, function stepping line-by-line
- Better variable tracking (object properties, local variables)
- Better tracking of user input while sketch is manually controlled (mouse clicks, key press, etc.)
