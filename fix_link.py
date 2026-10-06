import sys, re

def fix_link_color(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We replace text-black dark:text-white with !text-black dark:!text-white
    # Only in the specific block.
    # Actually, we can just replace 'class="text-black dark:text-white underline' with 'class="!text-black dark:!text-white underline'
    
    content = content.replace(
        'class="text-black dark:text-white underline',
        'class="!text-black dark:!text-white underline'
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_link_color('src/js/page_help.js')
fix_link_color('src/js/page_upload.js')
