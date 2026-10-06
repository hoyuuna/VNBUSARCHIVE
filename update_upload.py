import sys, re

with open('src/js/page_upload.js', 'r', encoding='utf-8') as f:
    code = f.read()

pattern = r"try \{\s*const res = await fetch\('https://raw\.githubusercontent\.com/hoyuuna/VNBUSARCHIVE/refs/heads/main/doc/Requirements\.md'\);\s*if \(!res\.ok\) throw new Error\('Network error'\);\s*const text = await res\.text\(\);\s*const html = DOMPurify\.sanitize\(marked\.parse\(text\)\);\s*container\.innerHTML = html;\s*container\.dataset\.loaded = 'true';\s*\} catch \(e\) \{\s*container\.innerHTML = '<p class=\"text-red-500 font-bold py-4 text-center\"><i class=\"fa-solid fa-triangle-exclamation\"></i> Không thể tải nội dung tự động. Vui lòng nhấn \"Xem chi tiết\" bên dưới.</p>';\s*\}"

replacement = """try {
                        const res = await fetch('https://raw.githubusercontent.com/hoyuuna/VNBUSARCHIVE/refs/heads/main/doc/Requirements.md');
                        if (!res.ok) throw new Error('Network error');
                        let text = await res.text();
                        
                        try {
                            const commitRes = await fetch(`https://api.github.com/repos/hoyuuna/VNBUSARCHIVE/commits?path=doc/Requirements.md&page=1&per_page=1`);
                            if (commitRes.ok) {
                                const commitData = await commitRes.json();
                                if (commitData && commitData.length > 0) {
                                    const commitHash = commitData[0].sha;
                                    const dateObj = new Date(commitData[0].commit.author.date);
                                    const formattedDate = ("0" + dateObj.getDate()).slice(-2) + "/" + ("0" + (dateObj.getMonth() + 1)).slice(-2) + "/" + dateObj.getFullYear();
                                    
                                    const updateBlock = `
                                        <div class="border border-black dark:border-white p-4 rounded-md mb-6 flex flex-wrap gap-2 items-center justify-between text-sm bg-white dark:bg-[#18181b] text-black dark:text-white">
                                            <div class="font-medium"><i class="fa-solid fa-clock-rotate-left mr-2"></i>Thay đổi lần cuối: ${formattedDate}</div>
                                            <a href="https://github.com/hoyuuna/VNBUSARCHIVE/commit/${commitHash}" target="_blank" class="text-xs font-bold uppercase tracking-wider bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-md hover:opacity-80 transition-opacity">
                                                Xem thay đổi
                                            </a>
                                        </div>
                                    `;
                                    text = text.replace(/\\*\\*👉 LƯU Ý: Cập nhật lần cuối.*?\\*\\*\\n*/, '');
                                    const html = DOMPurify.sanitize(updateBlock, { ADD_ATTR: ['target'] }) + DOMPurify.sanitize(marked.parse(text));
                                    container.innerHTML = html;
                                    
                                    const firstH1 = container.querySelector('h1');
                                    if (firstH1) firstH1.remove();
                                    container.dataset.loaded = 'true';
                                    return;
                                }
                            }
                        } catch(e){}

                        text = text.replace(/\\*\\*👉 LƯU Ý: Cập nhật lần cuối.*?\\*\\*\\n*/, '');
                        const html = DOMPurify.sanitize(marked.parse(text));
                        container.innerHTML = html;
                        const firstH1 = container.querySelector('h1');
                        if (firstH1) firstH1.remove();
                        container.dataset.loaded = 'true';
                    } catch (e) {
                        container.innerHTML = '<p class="text-red-500 font-bold py-4 text-center"><i class="fa-solid fa-triangle-exclamation"></i> Không thể tải nội dung tự động. Vui lòng nhấn "Xem chi tiết" bên dưới.</p>';
                    }"""

new_code = re.sub(pattern, replacement, code)

with open('src/js/page_upload.js', 'w', encoding='utf-8') as f:
    f.write(new_code)
