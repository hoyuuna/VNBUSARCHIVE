const fs = require('fs');
let code = fs.readFileSync('_core.html', 'utf8');

const regex = /::-webkit-scrollbar \{[\s\S]*?html\.theme-dark ::-webkit-scrollbar-thumb:hover \{[\s\S]*?\}/;

const newStyles = `::-webkit-scrollbar {
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
        html {
            scrollbar-width: thin;
            scrollbar-color: #d4d4d8 #3f3f46;
        }`;

if (code.match(regex)) {
    code = code.replace(regex, newStyles);
    fs.writeFileSync('_core.html', code, 'utf8');
    console.log('SUCCESS');
} else {
    console.log('NOT FOUND!');
}
