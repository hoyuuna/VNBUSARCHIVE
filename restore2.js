const fs = require('fs');
let c = fs.readFileSync('src/js/page_reference.js', 'utf8');

const missingCode = `
document.addEventListener('DOMContentLoaded', () => {
    const checkRouter = setInterval(() => {
        if (window.app && window.app.views && window.app.views.loadContact) {
            clearInterval(checkRouter); 
            const origLoadContact = window.app.views.loadContact;
            window.app.views.loadContact = () => {
                origLoadContact(); 
                if (window.app.contact && window.app.contact.init) {
                    window.app.contact.init(); 
                }
            };
        }
    }, 100);
});

window.app = window.app || {};
window.app.views = window.app.views || {};
window.app.views.selectRouteIcon = function(val, label) {
    document.getElementById('route-edit-icon').value = val;
    document.getElementById('route-icon-label').innerText = label;
    document.querySelectorAll('.route-icon-item').forEach(el => {
        el.classList.remove('selected');
        const icon = el.querySelector('.check-icon');
        if(icon) icon.classList.add('opacity-0');
    });
    const selectedEl = document.querySelector(\`.route-icon-item[data-val="\${val}"]\`);
    if(selectedEl) {
        selectedEl.classList.add('selected');
        const icon = selectedEl.querySelector('.check-icon');
        if(icon) icon.classList.remove('opacity-0');
    }
};
`;

if (!c.includes("selectRouteIcon = function")) {
    c += missingCode;
    fs.writeFileSync('src/js/page_reference.js', c);
    console.log("Appended to page_reference.js");
}
