import sys, re

def update_link(filepath, is_upload):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if is_upload:
        content = content.replace(
            'href="https://github.com/hoyuuna/VNBUSARCHIVE/commit/${commitHash}"',
            'href="https://github.com/hoyuuna/VNBUSARCHIVE/commits/main/doc/Requirements.md"'
        )
    else:
        content = content.replace(
            'href="https://github.com/hoyuuna/VNBUSARCHIVE/commit/${commitHash}"',
            'href="https://github.com/hoyuuna/VNBUSARCHIVE/commits/main/doc/${fileName}"'
        )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_link('src/js/page_help.js', False)
update_link('src/js/page_upload.js', True)
