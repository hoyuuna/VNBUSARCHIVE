import sys, re, os

def clean_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    new_lines = []
    for line in lines:
        if "// Extracted to" in line or "// Anchor =" in line or "// resizeDirX/Y" in line or "// Axis-constrained" in line or "// Rect =" in line or "// EXIF Consistency" in line or "// Removed early" in line or "// Dynamically swap" in line:
            if line.strip().startswith("//"):
                continue
            line = re.sub(r'//\s*(Extracted to|Anchor|resizeDirX|Axis-constrained|Rect =|EXIF Consistency|Removed early|Dynamically swap).*', '', line).rstrip() + '\n'
        new_lines.append(line)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

clean_file('src/js/page_help.js')
clean_file('src/js/page_upload.js')

# Also let's check other js files just in case
for file in os.listdir('src/js'):
    if file.endswith('.js'):
        clean_file(f'src/js/{file}')
