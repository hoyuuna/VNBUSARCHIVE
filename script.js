const fs = require('fs');
let c = fs.readFileSync('src/js/page_photo.js', 'utf8');

// Render Item Normal Buttons
c = c.replace(/style="display: flex; align-items: center; gap: 6px; background: white; border: 1px solid #d1d5db; color: #374151; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 12px; box-shadow: 0 1px 2px rgba\(0,0,0,0\.05\);"/g, 
'class="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm transition-colors hover:bg-gray-50 dark:bg-black dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900"');

// Render Item Delete Button
c = c.replace(/style="display: flex; align-items: center; gap: 6px; background: white; border: 1px solid #fca5a5; color: #dc2626; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 12px; box-shadow: 0 1px 2px rgba\(0,0,0,0\.05\);"/g, 
'class="flex items-center gap-1.5 bg-white border border-red-300 text-red-600 px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm transition-colors hover:bg-red-50 dark:bg-black dark:border-red-900 dark:text-red-500 dark:hover:bg-red-950"');

// Render Reply Normal Buttons
c = c.replace(/style="display: flex; align-items: center; gap: 4px; background: white; border: 1px solid #d1d5db; color: #4b5563; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 10px; box-shadow: 0 1px 2px rgba\(0,0,0,0\.05\);"/g, 
'class="flex items-center gap-1 bg-white border border-gray-300 text-gray-600 px-2 py-1 rounded-md font-bold text-[10px] shadow-sm transition-colors hover:bg-gray-50 dark:bg-black dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-900"');

// Render Reply Delete Button
c = c.replace(/style="display: flex; align-items: center; gap: 4px; background: white; border: 1px solid #fca5a5; color: #dc2626; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 10px; box-shadow: 0 1px 2px rgba\(0,0,0,0\.05\);"/g, 
'class="flex items-center gap-1 bg-white border border-red-300 text-red-600 px-2 py-1 rounded-md font-bold text-[10px] shadow-sm transition-colors hover:bg-red-50 dark:bg-black dark:border-red-900 dark:text-red-500 dark:hover:bg-red-950"');

// Remove all inline onmouseover and onmouseout
c = c.replace(/onmouseover="this\.style\.background='[^']+'"\s*onmouseout="this\.style\.background='[^']+'"/g, '');

// Fix name and content colors in renderItem
c = c.replace(/style="font-size: 14px; font-weight: bold; color: black; cursor: pointer; flex-shrink: 0;"/g, 
'class="text-sm font-bold text-black cursor-pointer shrink-0 dark:text-white"');

c = c.replace(/style="font-size: 11px; font-weight: bold; color: #9ca3af; display: block; margin-bottom: 8px;"/g, 
'class="text-[11px] font-bold text-gray-400 block mb-2 dark:text-gray-500"');

c = c.replace(/style="font-size: 14px; color: #1f2937; line-height: 1.6; word-break: break-word; white-space: pre-wrap; margin: 0;"/g, 
'class="text-sm text-gray-800 leading-relaxed break-words whitespace-pre-wrap m-0 dark:text-gray-300"');

// Fix name and content colors in renderReplyItem
c = c.replace(/style="font-size: 12px; font-weight: bold; color: black; cursor: pointer; flex-shrink: 0;"/g, 
'class="text-xs font-bold text-black cursor-pointer shrink-0 dark:text-white"');

c = c.replace(/style="font-size: 10px; font-weight: bold; color: #9ca3af; display: block; margin-bottom: 4px;"/g, 
'class="text-[10px] font-bold text-gray-400 block mb-1 dark:text-gray-500"');

c = c.replace(/style="font-size: 12px; color: #374151; line-height: 1.5; word-break: break-word; white-space: pre-wrap; margin: 0;"/g, 
'class="text-xs text-gray-700 leading-relaxed break-words whitespace-pre-wrap m-0 dark:text-gray-300"');

// Fix wrapper backgrounds
c = c.replace(/id="comment-\$\{c.id\}" class="bg-white border border-gray-200 shadow-sm z-10 relative" style="padding: 16px; border-radius: 16px; display: flex; gap: 12px; align-items: flex-start;"/g, 
'id="comment-${c.id}" class="bg-white border border-gray-200 shadow-sm z-10 relative p-4 rounded-2xl flex gap-3 items-start dark:bg-black dark:border-gray-800"');

c = c.replace(/id="comment-\$\{r.id\}" class="bg-gray-50 border border-gray-200 shadow-sm z-10 relative" style="padding: 12px; border-radius: 12px; display: flex; gap: 10px; align-items: flex-start; margin-bottom: 12px;"/g, 
'id="comment-${r.id}" class="bg-gray-50 border border-gray-200 shadow-sm z-10 relative p-3 rounded-xl flex gap-2.5 items-start mb-3 dark:bg-zinc-950 dark:border-gray-800"');

// Fix "Xem them X phan hoi" button
c = c.replace(/style="font-family: inherit; font-size: 11px; font-weight: bold; color: #4b5563; background: white; border: 1px solid #e5e7eb; padding: 6px 16px; border-radius: 8px; box-shadow: 0 1px 2px rgba\(0,0,0,0\.05\);"/g, 
'class="font-inherit text-[11px] font-bold text-gray-600 bg-white border border-gray-200 px-4 py-1.5 rounded-lg shadow-sm transition-colors hover:bg-gray-50 dark:bg-black dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-900"');

fs.writeFileSync('src/js/page_photo.js', c);
