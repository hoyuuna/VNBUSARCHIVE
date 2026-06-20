import re
import os

def process_core_html(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update font link
    old_font_link = '<link\n        href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Montserrat:wght@400;700;800;900&display=swap"\n        rel="stylesheet">'
    new_font_link = """<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/geist@1.0.0/dist/fonts/geist-sans/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/geist@1.0.0/dist/fonts/geist-mono/style.css">"""
    content = content.replace(old_font_link, new_font_link)
    
    old_font_link_single_line = '<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Montserrat:wght@400;700;800;900&display=swap" rel="stylesheet">'
    content = content.replace(old_font_link_single_line, new_font_link)

    # 2. Add some specific global style replacements inside <style>
    style_replacements = {
        'background-color: #fafafa;': 'background-color: #fafafa;', # Geist background-200
        'color: #09090b;': 'color: #171717;', # Geist gray-1000
        'border-bottom: 1px solid #e4e4e7;': 'border-bottom: 1px solid #eaeaea;', # gray-400
        'color: #71717a;': 'color: #8f8f8f;', # gray-700
        'background-color: #f4f4f5;': 'background-color: #f2f2f2;', # gray-100
        'border: 1px solid #e4e4e7;': 'border: 1px solid #eaeaea;', # gray-400
        'border-right: 1px solid #e4e4e7;': 'border-right: 1px solid #eaeaea;', # gray-400
        'box-shadow: inset 0 0 0 2px #18181b;': 'box-shadow: inset 0 0 0 2px #171717;', # gray-1000
        'color: #18181b;': 'color: #171717;', # gray-1000
        'border-bottom: 2px solid #18181b;': 'border-bottom: 2px solid #171717;', # gray-1000
        'border-color: #18181b;': 'border-color: #171717;', # gray-1000
    }
    for old, new in style_replacements.items():
        content = content.replace(old, new)

    # 3. Class replacements using regex
    def replace_class(pattern, replacement, text):
        return re.sub(r'(?<=[\s"\'`])' + pattern + r'(?=[>\s"\'`])', replacement, text)

    replacements = {
        r'bg-white': 'bg-background-100',
        r'text-black': 'text-gray-1000',
        r'bg-black': 'bg-gray-1000',
        r'text-gray-900': 'text-gray-1000',
        r'text-gray-800': 'text-gray-900',
        r'text-gray-700': 'text-gray-800',
        r'text-gray-600': 'text-gray-700',
        r'text-gray-500': 'text-gray-600',
        r'text-gray-400': 'text-gray-500',
        r'text-gray-300': 'text-gray-400',
        r'bg-gray-50': 'bg-background-200',
        r'bg-gray-100': 'bg-gray-100',
        r'bg-gray-200': 'bg-gray-200',
        r'border-gray-200': 'border-gray-300',
        r'border-gray-300': 'border-gray-400',
        r'border-gray-100': 'border-gray-200',
        r'rounded-2xl': 'rounded-lg',
        r'rounded-xl': 'rounded-lg',
        r'rounded-md': 'rounded-sm',
        r'shadow-sm': 'shadow-geist-raised',
        r'shadow-md': 'shadow-geist-popover',
        r'shadow-lg': 'shadow-geist-modal',
        r'shadow-xl': 'shadow-geist-modal',
        r'shadow-\[0_8px_16px_rgba\(0,0,0,0\.15\)\]': 'shadow-geist-popover',
    }

    def class_replacer(match):
        class_str = match.group(1)
        for pattern, replacement in replacements.items():
            class_str = replace_class(pattern, replacement, class_str)
        return f'class="{class_str}"'

    content = re.sub(r'class="([^"]+)"', class_replacer, content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Done applying Geist classes to " + file_path)

if __name__ == "__main__":
    process_core_html(r'c:\Users\Random user\Desktop\vietnam-bus-spotter-main\_core.html')
