import re
with open('_core.html', 'r', encoding='utf-8') as f:
    html = f.read()

start_idx = html.find('<div class="stats-grid max-w-3xl mx-auto">')
end_idx = html.find('</div>', html.find('</div>', html.find('</div>', html.find('</div>', start_idx) + 6) + 6) + 6) + 6

html = html[:start_idx] + '<p id="db-stat-sentence" class="text-center text-gray-700 text-sm md:text-base font-medium px-4 pb-6 mt-4"><i class="fa-solid fa-spinner fa-spin text-gray-300"></i> Đang tải thống kê...</p>' + html[end_idx:]

with open('_core.html', 'w', encoding='utf-8') as f:
    f.write(html)
