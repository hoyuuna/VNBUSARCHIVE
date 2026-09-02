const fs = require('fs');

const authOverrides = `
/* ===== AUTH PAGE FLAT OVERRIDE ===== */

/* Khung modal chính */
#auth .bg-white\\/70,
#auth .bg-white\\/80 {
    background-color: #ffffff !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
}

/* Viền trong suốt của các input và khung chính -> viền đen */
#auth .border.border-white\\/80,
#auth .border.border-white\\/60,
#auth .border.border-white\\/70 {
    border-color: #18181b !important;
}

/* Input fields */
#auth input {
    background-color: #fafafa !important;
    border: 1px solid #18181b !important;
    backdrop-filter: none !important;
}

/* Auth message box */
#auth #auth-msg {
    background-color: #fef2f2 !important;
}

/* Khung card modal auth */
#auth .rounded-3xl.bg-white\\/70 {
    background-color: #ffffff !important;
    border: 1px solid #18181b !important;
    box-shadow: none !important;
}

/* Shadow override */
#auth .shadow-\\[0_8px_32px_0_rgba\\(0\\,0\\,0\\,0\\.2\\)\\] {
    box-shadow: none !important;
}

/* Credit pill dưới card */
#auth .bg-white\\/60 {
    background-color: #ffffff !important;
}

/* Tab switcher login/register */
#auth .bg-white\\/60.border.border-white\\/70 {
    background-color: #f4f4f5 !important;
    border: 1px solid #18181b !important;
}

/* Nút social login Google */
#auth .border.border-gray-300\\/80 {
    border-color: #18181b !important;
}
`;

const file = 'public/css/light.css';
let css = fs.readFileSync(file, 'utf8');
if (!css.includes('/* ===== AUTH PAGE FLAT OVERRIDE ===== */')) {
    css += authOverrides;
    fs.writeFileSync(file, css);
    console.log('Added auth page overrides to light.css');
} else {
    console.log('Auth overrides already present');
}
