const fs = require('fs');

let html = fs.readFileSync('_core.html', 'utf8');

// Add ticket-ui-container ID
const uiContainerSearch = `<div class="max-w-6xl mx-auto h-[85vh] min-h-[500px] flex rounded-2xl shadow-sm border border-gray-200 bg-white overflow-hidden">`;
const uiContainerReplace = `<div id="ticket-ui-container" class="max-w-6xl mx-auto h-[85vh] min-h-[500px] flex rounded-2xl shadow-sm border border-gray-200 bg-white overflow-hidden">`;
html = html.replace(uiContainerSearch, uiContainerReplace);

// Update isManager logic in app.ticket
const managerSearch = `const isManager = app.role === 'admin' || app.role === 'manager';`;
const managerReplace = `const isManager = (app.role === 'admin' || app.role === 'manager') && app.ticket.isAdminMode;`;
html = html.split(managerSearch).join(managerReplace);

// Update init to move the UI back and set mode
const initSearch = `        app.views.switch('ticket', false);
        document.title = 'Hỗ trợ trực tuyến | VNBUSARCHIVE';

        try {`;
const initReplace = `        app.views.switch('ticket', false);
        document.title = 'Hỗ trợ trực tuyến | VNBUSARCHIVE';

        const uiContainer = document.getElementById('ticket-ui-container');
        if (uiContainer) document.getElementById('ticket').appendChild(uiContainer);
        app.ticket.isAdminMode = false;

        try {`;
html = html.replace(initSearch, initReplace);

// Update loadTab for 'tickets' to move UI to admin
const loadTabTicketsSearch = `                        } else if (tab === 'tickets') {
                            content.className = "col-span-full";
                            content.innerHTML = \`
                                <div class="col-span-full bg-white border border-gray-200 rounded-2xl p-8 md:p-12 text-center shadow-sm">
                                    <div class="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-sm border border-blue-100"><i class="fa-solid fa-headset"></i></div>
                                    <h3 class="text-2xl font-black uppercase text-black mb-3">Hệ thống Trò chuyện Hỗ trợ</h3>
                                    <p class="text-gray-600 text-sm mb-8 max-w-lg mx-auto leading-relaxed">Để đảm bảo trải nghiệm nhắn tin tốt nhất (Realtime, thông báo gõ phím), tính năng trò chuyện được thiết kế ở một <b>giao diện độc lập hoàn toàn</b>.</p>
                                    <button onclick="app.utils.navigate('/ticket')" class="bg-black text-white px-8 py-3.5 rounded-xl font-bold shadow-lg hover:bg-gray-800 transition hover:-translate-y-0.5"><i class="fa-solid fa-up-right-from-square mr-2"></i> Mở không gian làm việc</button>
                                </div>
                            \`;
                        } else if (tab === 'manager') {`;
const loadTabTicketsReplace = `                        } else if (tab === 'tickets') {
                            content.className = "col-span-full";
                            const uiContainer = document.getElementById('ticket-ui-container');
                            if (uiContainer) {
                                content.innerHTML = '';
                                content.appendChild(uiContainer);
                            }
                            app.ticket.isAdminMode = true;
                            app.ticket.initFirebase().then(() => {
                                app.ticket.loadTicketList();
                            });
                        } else if (tab === 'manager') {`;
html = html.replace(loadTabTicketsSearch, loadTabTicketsReplace);

// Add isAdminMode to ticket object
const ticketDefSearch = `ticket: {
    db: null,
    isInitialized: false,
    currentTicketId: null,
    listeners: {},`;
const ticketDefReplace = `ticket: {
    db: null,
    isInitialized: false,
    isAdminMode: false,
    currentTicketId: null,
    listeners: {},`;
html = html.replace(ticketDefSearch, ticketDefReplace);

fs.writeFileSync('_core.html', html, 'utf8');
console.log("Core updated successfully.");
