const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');

const html = fs.readFileSync('_core.html', 'utf8');
const dom = new JSDOM(html);
const document = dom.window.document;

const app = {
    ui: {
        alertCallback: null,
        alertCancelCallback: null,
        alertInterval: null,
        unlockScroll: () => {},
        closeAlert: () => {}
    }
};

const js = fs.readFileSync('src/js/1_init.js', 'utf8');
const showAlertMatch = js.match(/showAlert: \([\s\S]*?\},[\s\n]*closeAlert:/);
if (!showAlertMatch) {
    console.log("Could not extract showAlert");
    process.exit(1);
}

let showAlertBody = showAlertMatch[0];
showAlertBody = showAlertBody.replace('showAlert:', 'app.ui.showAlert = ');
showAlertBody = showAlertBody.replace(/,[\s\n]*closeAlert:$/, ';');

eval(showAlertBody);

app.ui.showAlert("Bạn có chắc chắn muốn hủy yêu cầu này không? Hành động này không thể hoàn tác.", async () => {}, () => {}, { title: "Xác nhận hủy", btnOkText: "Xác nhận", btnCancelText: "Hủy" });

const cancelBtn = document.getElementById('custom-alert-cancel-btn');
console.log("cancelBtn classList:", Array.from(cancelBtn.classList));
console.log("cancelBtn inline style:", cancelBtn.style.display);
console.log("cancelBtn innerText:", cancelBtn.innerText);
console.log("cancelBtn hidden attribute?", cancelBtn.hasAttribute('hidden'));
