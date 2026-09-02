const fs = require('fs');
let js = fs.readFileSync('src/js/2_auth.js', 'utf8');

js = js.replace(/btn\.className = "pref-option cursor-pointer border border-black bg-black text-white rounded-xl p-3\.5 shadow-md transition-all flex items-center gap-4 scale-\[1\.02\]";\s*btn\.querySelector\('\.rounded-full'\)\.className = "w-10 h-10 rounded-full bg-white\/20 border border-white\/30 flex items-center justify-center shrink-0 transition-colors";/, 
`btn.className = "pref-option cursor-pointer border border-black bg-black text-white rounded-xl p-3.5 shadow-md transition-all flex items-center gap-4 scale-[1.02]";
                            btn.querySelector('.rounded-full').className = "w-10 h-10 rounded-full bg-white text-black border-transparent flex items-center justify-center shrink-0 transition-colors";`);

js = js.replace(/btn\.className = "pref-option cursor-pointer border border-gray-300 bg-white\/70 backdrop-blur-md rounded-xl p-3\.5 shadow-sm hover:shadow-md hover:border-black transition-all flex items-center gap-4 scale-100";\s*btn\.querySelector\('\.rounded-full'\)\.className = "w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 transition-colors";/,
`btn.className = "pref-option cursor-pointer border border-gray-300 bg-white text-gray-800 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-gray-400 transition-all flex items-center gap-4 scale-100";
                            btn.querySelector('.rounded-full').className = "w-10 h-10 rounded-full bg-gray-100 text-gray-800 border-transparent flex items-center justify-center shrink-0 transition-colors";`);

fs.writeFileSync('src/js/2_auth.js', js);
console.log('Fixed auth preference bg classes.');
