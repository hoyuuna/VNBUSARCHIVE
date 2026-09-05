const fs = require('fs');
let code = fs.readFileSync('_core.html', 'utf8');

const regex = /\.no-scrollbar::-webkit-scrollbar \{[\s\S]*?html \{/;

const fix = `.no-scrollbar::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
        }
        .no-scrollbar {
            -ms-overflow-style: none !important;  /* IE and Edge */
            scrollbar-width: none !important;  /* Firefox */
        }

        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        ::-webkit-scrollbar-track {
            background: #3f3f46; /* ray xám đậm */
        }

        ::-webkit-scrollbar-thumb {
            background: #d4d4d8; /* thanh xám nhạt */
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #f4f4f5; /* sáng hơn khi hover */
        }
        
        /* Hỗ trợ Firefox */
        html {`;

if (code.match(regex)) {
    code = code.replace(regex, fix);
    fs.writeFileSync('_core.html', code, 'utf8');
    console.log('SUCCESS');
} else {
    console.log('NOT FOUND!');
}
