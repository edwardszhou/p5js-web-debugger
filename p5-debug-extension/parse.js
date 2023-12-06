function generate_random_string(length = 100) {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let random_string = '';
    for (let i = 0; i < length; i++) {
        random_string += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return random_string;
};
    
function handle_global_line(line) {
    let inits = line.split(";").map(a => a.trim());
    inits = inits.filter(i => i !== '');
    
    let p5_assigments = [];
    let global_declarations = [];

    for (let i = 0; i < inits.length; i++) {
        let components = inits[i].split(" ");
        if (components[0] === 'const') {
            let init = inits[i] + ";";
            global_declarations.push(init);
            continue;
        }
        let assignment = "" + components.slice(1).join(" ");
        assignment += ";";
        let declaration = "" + components.slice(0, 2).join(" ");
        declaration += ";";

        p5_assigments.push(assignment);
        global_declarations.push(declaration);
    }
    return [p5_assigments, global_declarations];
}


function transform_code(lines, key_pattern, global_pattern) {

    let setup_braces = [];
    let global_braces = [];

    let in_setup = false;
    let p5_setup = [];
    let setup = [];

    let p5_assigments = [];
    let global_declarations = [];

    let output_content = [];
    let hold_code = [];

    for(let line of lines) {
        let code_line = line.split("//")[0];
        if (code_line.includes("function setup()") || code_line.includes( "function setup ")) {
            in_setup = true;
            new_code = code_line.replace('setup', 'P5DEBUG__setup');
            if (code_line.includes("{"))
                setup_braces.push('{');
            setup.push(code_line);
            p5_setup.push(new_code);
            continue;
        }

        if (code_line.includes('function draw()') || code_line.includes('function draw ')) {
            code_line = code_line.replace('draw', 'P5DEBUG__draw');
        }
        
        if (in_setup) {
            if (code_line.includes('{'))
                setup_braces.push('{');

            if (code_line.includes('}'))
                setup_braces.pop();

            if (code_line.search(key_pattern) != -1) {
                let a;

                let matches = code_line.match(key_pattern);
                for(let match of matches) {
                    if(match) {
                        a = match;
                        break;
                    }
                }

                if(a.includes('createCanvas')) {
                    setup.push(`\tvar P5DEBUG__canvas = ${a}\n`);
                    setup.push(`\tP5DEBUG__canvas.parent('canvas-container');\n`)
                } else {
                    let b = generate_random_string(10);
                    setup.push(`\tvar ${b} = ${a}\n`);
                    setup.push(`\t${b}.parent('canvas-container');\n`)
                }
            } else {
                p5_setup.push(code_line);
            }
            if (!setup_braces) {
                setup.push('}\n');
                in_setup = false;
            }
        } else {
            if(code_line.includes("{"))
                global_braces.push("{");

            if(code_line.includes("}"))
                global_braces.pop();

            if(global_braces.length == 0 && code_line.search(global_pattern) != -1) {
                let line_parts = handle_global_line(code_line);
                p5_assigments.push(...line_parts[0]);
                global_declarations.push(...line_parts[1]);
            } else {
                hold_code.push(code_line);
            }
        }
    }

    for(let assignment of p5_assigments) {
        p5_setup.splice(1, 0, assignment + "\n");
    }
    for(let declaration of global_declarations) {
        output_content.push(declaration + "\n");
    }
    output_content.push("\n")
    output_content.push(...setup)
    output_content.push("\nP5DEBUG__setup();}")
    output_content.push("\n")
    output_content.push(...p5_setup)
    output_content.push(...hold_code)

    return output_content
}

const global_pattern = /(let)|(var)|(const)/;
const key_pattern = /(createDiv|createP|createSpan|createImg|createA|createSlider|createButton|createCheckbox|createSelect|createRadio|createColorPicker|createInput|createFileInput|createVideo|createAudio|createCapture|createElement|createWriter|createImage|createCanvas|createGraphics|createFramebuffer)(.*)/;
