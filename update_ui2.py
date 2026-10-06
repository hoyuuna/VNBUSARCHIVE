import sys, re

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    pattern = re.compile(
        r'const updateBlock = `\s*<div class="border border-black dark:border-white p-4.*?</div>\s*`;',
        re.DOTALL
    )
    
    replacement = '''const updateBlock = `
                                        <div class="border border-black dark:border-white p-3 rounded-md mb-6 text-sm bg-white dark:bg-[#18181b] text-black dark:text-white font-medium">
                                            <i class="fa-solid fa-clock-rotate-left mr-2"></i>Thay đổi lần cuối: ${formattedDate} 
                                            <a href="https://github.com/hoyuuna/VNBUSARCHIVE/commit/${commitHash}" target="_blank" class="text-black dark:text-white underline hover:opacity-80 transition-opacity ml-1">(xem thay đổi)</a>
                                        </div>
                                    `;'''
    
    new_content = pattern.sub(replacement, content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

update_file('src/js/page_help.js')
update_file('src/js/page_upload.js')
