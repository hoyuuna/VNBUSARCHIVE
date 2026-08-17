import re

with open('src/js/1_init.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = "renderProvider('Discord', 'fa-brands fa-discord', 'bg-[#5865F2]', 'discord');"
replacement = "renderProvider('Discord', 'fa-brands fa-discord', 'bg-[#5865F2]', 'discord') +\n                            renderProvider('GitHub', 'fa-brands fa-github', 'bg-[#24292e]', 'github');"

content = content.replace(target, replacement)

with open('src/js/1_init.js', 'w', encoding='utf-8') as f:
    f.write(content)
