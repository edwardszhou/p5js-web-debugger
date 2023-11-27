import re

def read_js_file(file_path):
    with open(file_path, 'r') as file:
        return file.readlines()

def transform_code(lines):
    transformed_lines = []
    function_content = []
    brace_stack = []
    current_function = None

    for line in lines:
        if 'function setup()' in line:
            current_function = 'p5_setup'
            transformed_lines.append('function setup() {\n  p5_setup();\n}\n\n')
            transformed_lines.append('function p5_setup() {\n')
            brace_stack.append('{')
            continue

        if 'function draw()' in line:
            current_function = 'p5_draw'
            transformed_lines.append('function draw() {\n  p5_draw();\n}\n\n')
            transformed_lines.append('function p5_draw() {\n')
            brace_stack.append('{')
            continue

        if current_function:
            if '{' in line:
                brace_stack.append('{')
            if '}' in line:
                brace_stack.pop()
                if not brace_stack:
                    
                    # end current function content

                    transformed_lines.extend(function_content)
                    transformed_lines.append('}\n\n')
                    function_content = []
                    current_function = None
                    continue
            if brace_stack:
                function_content.append(line)
        else:
            transformed_lines.append(line)

    return transformed_lines

def write_js_file(file_path, lines):
    with open(file_path, 'w') as file:
        for line in lines:
            file.write(line)




original_file_path = 'text.js'
transformed_file_path = 'output.js'

lines = read_js_file(original_file_path)
transformed_lines = transform_code(lines)
write_js_file(transformed_file_path, transformed_lines)
