const fs = require('fs');

let html = fs.readFileSync('_core.html', 'utf8');

// 1. Replace #ticket layout
const newTicketUI = `<div id="ticket" class="view-section">
    <div class="max-w-6xl mx-auto h-[85vh] min-h-[500px] flex rounded-2xl shadow-sm border border-gray-200 bg-white overflow-hidden">
        
        <!-- CỘT TRÁI: DANH SÁCH TICKET -->
        <div id="ticket-sidebar" class="w-full md:w-[35%] lg:w-[30%] flex flex-col bg-gray-50/30 border-r border-gray-200 shrink-0 h-full">
            <div class="p-4 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
                <h2 class="font-bold text-lg uppercase tracking-tight text-black">Hỗ trợ</h2>
                <button onclick="app.ticket.createNew()" class="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-800 transition shadow-sm">
                    <i class="fa-solid fa-plus mr-1"></i> Tạo mới
                </button>
            </div>
            
            <div id="ticket-list" class="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                <p class="text-center text-gray-400 py-10 text-xs"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang kết nối...</p>
            </div>
        </div>

        <!-- CỘT PHẢI: KHUNG CHAT -->
        <div id="ticket-chat-area" class="hidden md:flex flex-col flex-1 bg-white h-full relative w-full">
            
            <!-- Trạng thái trống (Chưa chọn ticket) -->
            <div id="ticket-empty-state" class="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/50 z-30">
                <div class="w-16 h-16 bg-white border border-gray-200 rounded-full flex items-center justify-center text-2xl text-gray-300 mb-3 shadow-sm"><i class="fa-solid fa-comments"></i></div>
                <p class="text-sm font-bold text-gray-500">Chọn một vé hỗ trợ để bắt đầu trò chuyện</p>
            </div>

            <!-- Header Chat -->
            <div class="p-3 md:p-4 border-b border-gray-200 bg-white flex items-center gap-3 shrink-0 shadow-sm relative z-20">
                <button onclick="app.ticket.closeMobileChat()" class="md:hidden text-gray-500 hover:text-black p-2"><i class="fa-solid fa-arrow-left text-lg"></i></button>
                <div class="flex-1 overflow-hidden">
                    <div class="flex items-center gap-2">
                        <h3 id="ticket-chat-title" class="font-bold text-sm md:text-base text-black font-mono">#------</h3>
                        <span id="ticket-chat-status" class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500">Đang tải</span>
                    </div>
                    <p id="ticket-typing-indicator" class="text-[11px] text-gray-500 italic mt-0.5 h-4 opacity-0 transition-opacity">Ai đó đang nhập...</p>
                </div>
                <!-- Nút Đóng Ticket (Chỉ Manager thấy) -->
                <button id="btn-toggle-ticket-status" onclick="app.ticket.toggleStatus()" class="hidden border border-gray-300 bg-white text-black hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm whitespace-nowrap">
                    Đóng vé
                </button>
            </div>

            <!-- Nội dung Chat -->
            <div id="ticket-messages" class="flex-1 overflow-y-auto p-4 space-y-4 bg-white custom-scrollbar">
                <!-- Messages render here -->
            </div>

            <!-- Khung nhập -->
            <div id="ticket-input-wrapper" class="p-3 md:p-4 bg-gray-50/50 border-t border-gray-200 shrink-0">
                <div id="ticket-closed-msg" class="hidden text-center text-xs text-red-500 font-bold bg-red-50 py-3 rounded-xl border border-red-100 shadow-sm">
                    <i class="fa-solid fa-lock mr-1"></i> Vé hỗ trợ này đã đóng. Không thể gửi thêm tin nhắn.
                </div>
                <form id="ticket-chat-form" class="flex gap-2" onsubmit="app.ticket.sendMessage(event)">
                    <input type="text" id="ticket-input" class="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black transition-all text-black shadow-inner" placeholder="Nhập tin nhắn..." autocomplete="off">
                    <button type="submit" id="ticket-send-btn" class="bg-black text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        <i class="fa-solid fa-paper-plane"></i>
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>`;
const startTicketUI = html.indexOf('<div id="ticket" class="view-section">');
const endTicketUI = html.indexOf('<div id="contact" class="view-section">');
if (startTicketUI !== -1 && endTicketUI !== -1) {
    html = html.substring(0, startTicketUI) + newTicketUI + '\n            ' + html.substring(endTicketUI);
    console.log("Chunk 1 UI Applied.");
}

// 2. Remove old #mgr-sec-tickets
const mgrTicketsTarget = `                                     <!-- TAB: QUẢN LÝ TICKETS -->
                                     <div id="mgr-sec-tickets" class="hidden">
                                         <div class="flex items-center justify-between mb-4">
                                             <h3 class="font-bold text-gray-800">Danh sách vé yêu cầu hỗ trợ</h3>
                                             <button onclick="app.utils.navigate('/ticket')" class="bg-black text-white px-4 py-2 rounded text-xs font-bold shadow-sm">Mở giao diện Chat</button>
                                         </div>
                                         <p class="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200"><i class="fa-solid fa-circle-info mr-1"></i> Manager hãy truy cập vào <b>Giao diện Chat</b> để xem toàn bộ danh sách, trả lời trực tiếp và đóng/mở vé hỗ trợ của người dùng.</p>
                                     </div>`;
if (html.includes(mgrTicketsTarget)) {
    html = html.replace(mgrTicketsTarget, '');
    console.log("Chunk 2 mgrTickets Removed.");
}

// 3. Add adm-tab-tickets
const tabRequestsTarget = `lý Xóa (<span id="count-delete">0</span>)</button>`;
const tabRequestsReplace = `lý Xóa (<span id="count-delete">0</span>)</button>\n                    <button onclick="app.admin.loadTab('tickets')" id="adm-tab-tickets" class="hidden px-5 py-2 bg-white border border-gray-300 text-gray-600 font-bold rounded-md text-sm hover:bg-gray-50 transition whitespace-nowrap">Hỗ trợ (<span id="count-tickets">0</span>)</button>`;
if (html.includes(tabRequestsTarget)) {
    html = html.replace(tabRequestsTarget, tabRequestsReplace);
    console.log("Chunk 3 Adm Tab Tickets Added.");
}

// 4. Update app.setUser
const setUserTarget = `// [THÊM MỚI] Hiển thị tab Quản lý nếu là Manager
                        if (app.role === 'manager') {
                            document.getElementById('adm-tab-manager').classList.remove('hidden');
                        }`;
const setUserReplace = `// [THÊM MỚI] Hiển thị tab Quản lý nếu là Manager
                        if (app.role === 'manager') {
                            document.getElementById('adm-tab-manager').classList.remove('hidden');
                            document.getElementById('adm-tab-tickets').classList.remove('hidden');
                        }`;
if (html.includes(setUserTarget)) {
    html = html.replace(setUserTarget, setUserReplace);
    console.log("Chunk 4 app.setUser Updated.");
}

// 5. Update refreshCounts
const refreshCountsTarget = `document.getElementById('count-delete').innerText = delCount;

                        return (pCount || 0) + editCount + delCount;`;
const refreshCountsReplace = `document.getElementById('count-delete').innerText = delCount;

                        // ĐOẠN THÊM MỚI: FETCH SỐ LƯỢNG TIN NHẮN TỪ FIREBASE CHO MANAGER
                        if (app.role === 'manager') {
                            app.ticket.initFirebase().then(() => {
                                app.ticket.db.ref('tickets').once('value', snapshot => {
                                    let unread = 0;
                                    snapshot.forEach(child => { if (child.val().unread_manager > 0) unread++; });
                                    const countEl = document.getElementById('count-tickets');
                                    if (countEl) countEl.innerText = unread;
                                    if (unread > 0) document.getElementById('adm-tab-tickets').classList.add('text-blue-600', 'border-blue-400');
                                    else document.getElementById('adm-tab-tickets').classList.remove('text-blue-600', 'border-blue-400');
                                });
                            }).catch(e => console.log(e));
                        }

                        // CHÚ Ý: Không cộng số Ticket vào return để tránh chuông báo của Admin thường bị nhảy!
                        return (pCount || 0) + editCount + delCount;`;
if (html.includes(refreshCountsTarget)) {
    html = html.replace(refreshCountsTarget, refreshCountsReplace);
    console.log("Chunk 5 refreshCounts Updated.");
}

// 6. Update loadTab
const loadTabTarget = `['photos', 'requests', 'delete', 'manager', 'comments'].forEach(t => {`;
const loadTabReplace = `['photos', 'requests', 'delete', 'manager', 'comments', 'tickets'].forEach(t => {`;
if (html.includes(loadTabTarget)) {
    html = html.replace(loadTabTarget, loadTabReplace);
    console.log("Chunk 6 loadTab array Updated.");
}

const loadTabLogicTarget = `app.admin.renderCommentsData();
                        } else if (tab === 'manager') {`;
const loadTabLogicReplace = `app.admin.renderCommentsData();
                        } else if (tab === 'tickets') {
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
if (html.includes(loadTabLogicTarget)) {
    html = html.replace(loadTabLogicTarget, loadTabLogicReplace);
    console.log("Chunk 7 loadTab logic Updated.");
}

// 7. Update ticket: { ... }
const newTicketObject = `ticket: {
    db: null,
    isInitialized: false,
    currentTicketId: null,
    listeners: {},
    typingTimeout: null,
    ticketsData: {},

    // Tách riêng hàm kết nối Firebase để Admin có thể đếm số ngầm
    initFirebase: async () => {
        if (app.ticket.isInitialized) return;
        const res = await fetch('/firebase-config');
        if (!res.ok) throw new Error("Không lấy được cấu hình Firebase");
        const config = await res.json();
        if (!firebase.apps.length) firebase.initializeApp(config);
        app.ticket.db = firebase.database();
        app.ticket.isInitialized = true;
    },

    init: async () => {
        if (!app.user) return app.utils.navigate('/auth');
        app.views.switch('ticket', false);
        document.title = 'Hỗ trợ trực tuyến | VNBUSARCHIVE';

        try {
            await app.ticket.initFirebase();
            app.ticket.loadTicketList();
            
            // Xử lý UI Mobile khởi tạo
            document.getElementById('ticket-sidebar').classList.remove('hidden');
            document.getElementById('ticket-chat-area').classList.remove('flex');
            document.getElementById('ticket-chat-area').classList.add('hidden', 'md:flex');
        } catch (err) {
            app.ui.showAlert("Lỗi kết nối hệ thống Chat: " + err.message);
        }
    },

    createNew: async () => {
        if (!app.user) return;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let newId = '';
        for (let i = 0; i < 6; i++) newId += chars.charAt(Math.floor(Math.random() * chars.length));

        const newTicket = {
            id: newId,
            creator_id: app.user.id,
            creator_name: app.username,
            creator_avatar: app.user.user_metadata?.avatar_url || 'https://files.catbox.moe/zzh1q1.png',
            status: 'open',
            created_at: Date.now(),
            last_message: 'Yêu cầu hỗ trợ mới được tạo',
            last_updated: Date.now(),
            unread_manager: 1,
            unread_user: 0
        };

        try {
            await app.ticket.db.ref(\`tickets/\${newId}\`).set(newTicket);
            app.ticket.openChat(newId);
        } catch (e) { app.ui.showAlert("Lỗi tạo vé: " + e.message); }
    },

    loadTicketList: () => {
        const listEl = document.getElementById('ticket-list');
        const isManager = app.role === 'admin' || app.role === 'manager';
        const ref = app.ticket.db.ref('tickets');
        if (app.ticket.listeners['list']) ref.off('value', app.ticket.listeners['list']);

        const callback = ref.on('value', (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                listEl.innerHTML = '<p class="text-center text-gray-400 py-10 text-xs font-medium">Chưa có vé hỗ trợ nào.</p>';
                return;
            }

            let ticketsArray = Object.values(data);
            if (!isManager) ticketsArray = ticketsArray.filter(t => t.creator_id === app.user.id);
            ticketsArray.sort((a, b) => b.last_updated - a.last_updated);

            app.ticket.ticketsData = {};
            ticketsArray.forEach(t => app.ticket.ticketsData[t.id] = t);

            if (ticketsArray.length === 0) {
                listEl.innerHTML = '<p class="text-center text-gray-400 py-10 text-xs font-medium">Bạn chưa tạo vé hỗ trợ nào.</p>';
                return;
            }

            listEl.innerHTML = ticketsArray.map(t => {
                const isActive = app.ticket.currentTicketId === t.id;
                const unreadCount = isManager ? (t.unread_manager || 0) : (t.unread_user || 0);
                const unreadBadge = unreadCount > 0 ? \`<span class="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1">\${unreadCount}</span>\` : '';
                const statusBadge = t.status === 'open' 
                    ? '<span class="text-[9px] font-bold text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded uppercase">Mở</span>'
                    : '<span class="text-[9px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded uppercase">Đóng</span>';
                const avatarUrl = isManager ? t.creator_avatar : 'https://files.catbox.moe/zzh1q1.png';
                const displayName = isManager ? t.creator_name : 'Hỗ trợ VNBUSARCHIVE';

                return \`
                    <div onclick="app.ticket.openChat('\${t.id}')" class="p-3 rounded-xl border cursor-pointer transition-all \${isActive ? 'bg-blue-50 border-blue-400 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-400'}">
                        <div class="flex items-center justify-between mb-2">
                            <div class="font-mono text-sm font-black text-black">#\${t.id}</div>
                            <div class="flex items-center">\${statusBadge} \${unreadBadge}</div>
                        </div>
                        <div class="flex items-center gap-2">
                            <img src="\${avatarUrl}" class="w-6 h-6 rounded-full object-cover bg-gray-100 shrink-0">
                            <div class="overflow-hidden">
                                <p class="text-xs font-bold text-gray-800 truncate">\${app.utils.cleanText(displayName)}</p>
                                <p class="text-[10px] text-gray-500 truncate mt-0.5">\${app.utils.cleanText(t.last_message || '')}</p>
                            </div>
                        </div>
                    </div>
                \`;
            }).join('');
            
            if (app.ticket.currentTicketId) app.ticket.updateChatHeader(app.ticket.ticketsData[app.ticket.currentTicketId]);
        });
        app.ticket.listeners['list'] = callback;
    },

    openChat: (ticketId) => {
        app.ticket.currentTicketId = ticketId;
        const isManager = app.role === 'admin' || app.role === 'manager';
        const tData = app.ticket.ticketsData[ticketId];

        document.getElementById('ticket-empty-state').classList.add('hidden');
        app.ticket.updateChatHeader(tData);

        // Đóng mở giao diện mượt mà trên Mobile (Sửa triệt để vụ đè Layout)
        document.getElementById('ticket-sidebar').classList.add('hidden', 'md:flex');
        const chatArea = document.getElementById('ticket-chat-area');
        chatArea.classList.remove('hidden');
        chatArea.classList.add('flex');

        const msgContainer = document.getElementById('ticket-messages');
        msgContainer.innerHTML = '';
        
        if (app.ticket.listeners['messages']) app.ticket.db.ref(\`ticket_messages/\${app.ticket.listeners['prev_id']}\`).off('child_added', app.ticket.listeners['messages']);

        const msgCallback = app.ticket.db.ref(\`ticket_messages/\${ticketId}\`).on('child_added', (snapshot) => {
            const msg = snapshot.val();
            const isMe = msg.sender_id === app.user.id;
            const timeStr = new Date(msg.timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
            const badge = msg.sender_role === 'manager' || msg.sender_role === 'admin' ? '<i class="fa-solid fa-shield-halved text-blue-500 ml-1 text-[10px]" title="Ban Quản Trị"></i>' : '';
            const alignClass = isMe ? 'justify-end' : 'justify-start';
            const bubbleClass = isMe ? 'bg-black text-white rounded-2xl rounded-tr-sm' : 'bg-white border border-gray-200 text-black rounded-2xl rounded-tl-sm shadow-sm';
            const avatarHtml = \`<img src="\${msg.sender_avatar}" class="w-7 h-7 rounded-full object-cover bg-gray-100 shrink-0 mt-auto">\`;
            
            msgContainer.innerHTML += \`
                <div class="flex w-full \${alignClass} gap-2 mb-4 fade-zoom-in">
                    \${!isMe ? avatarHtml : ''}
                    <div class="flex flex-col \${isMe ? 'items-end' : 'items-start'} max-w-[75%]">
                        <div class="flex items-baseline gap-2 mb-1 px-1">
                            <span class="text-[10px] font-bold text-gray-500">\${app.utils.cleanText(msg.sender_name)}\${badge}</span>
                            <span class="text-[9px] text-gray-400">\${timeStr}</span>
                        </div>
                        <div class="px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words \${bubbleClass}">\${app.utils.cleanText(msg.text)}</div>
                    </div>
                    \${isMe ? avatarHtml : ''}
                </div>
            \`;
            msgContainer.scrollTop = msgContainer.scrollHeight;
        });
        app.ticket.listeners['messages'] = msgCallback;
        app.ticket.listeners['prev_id'] = ticketId;

        if (isManager) app.ticket.db.ref(\`tickets/\${ticketId}/unread_manager\`).set(0);
        else app.ticket.db.ref(\`tickets/\${ticketId}/unread_user\`).set(0);

        const inputEl = document.getElementById('ticket-input');
        inputEl.oninput = () => {
            app.ticket.db.ref(\`tickets/\${ticketId}/typing/\${app.user.id}\`).set(Date.now());
            if (app.ticket.typingTimeout) clearTimeout(app.ticket.typingTimeout);
            app.ticket.typingTimeout = setTimeout(() => { app.ticket.db.ref(\`tickets/\${ticketId}/typing/\${app.user.id}\`).remove(); }, 2000);
        };

        if (app.ticket.listeners['typing']) app.ticket.db.ref(\`tickets/\${app.ticket.listeners['prev_id']}/typing\`).off('value', app.ticket.listeners['typing']);
        const typingIndicator = document.getElementById('ticket-typing-indicator');
        const typingCallback = app.ticket.db.ref(\`tickets/\${ticketId}/typing\`).on('value', (snapshot) => {
            const typers = snapshot.val();
            let isTyping = false;
            if (typers) { Object.keys(typers).forEach(uid => { if (uid !== app.user.id) isTyping = true; }); }
            if (isTyping) typingIndicator.classList.remove('opacity-0');
            else typingIndicator.classList.add('opacity-0');
        });
        app.ticket.listeners['typing'] = typingCallback;

        app.ticket.loadTicketList();
    },

    closeMobileChat: () => {
        document.getElementById('ticket-sidebar').classList.remove('hidden', 'md:flex');
        document.getElementById('ticket-sidebar').classList.add('flex');
        document.getElementById('ticket-chat-area').classList.add('hidden');
        document.getElementById('ticket-chat-area').classList.remove('flex');
        app.ticket.currentTicketId = null;
        app.ticket.loadTicketList();
    },

    updateChatHeader: (tData) => {
        if (!tData) return;
        const isManager = app.role === 'admin' || app.role === 'manager';
        document.getElementById('ticket-chat-title').innerText = \`#\${tData.id}\`;
        const statusEl = document.getElementById('ticket-chat-status');
        const formEl = document.getElementById('ticket-chat-form');
        const closedMsg = document.getElementById('ticket-closed-msg');
        const toggleBtn = document.getElementById('btn-toggle-ticket-status');

        if (tData.status === 'open') {
            statusEl.innerText = 'Đang mở';
            statusEl.className = 'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-600 border border-green-200';
            formEl.classList.remove('hidden'); closedMsg.classList.add('hidden');
            if (isManager) { toggleBtn.classList.remove('hidden'); toggleBtn.innerText = "Đóng vé"; }
        } else {
            statusEl.innerText = 'Đã đóng';
            statusEl.className = 'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 border border-gray-200';
            formEl.classList.add('hidden'); closedMsg.classList.remove('hidden');
            if (isManager) { toggleBtn.classList.remove('hidden'); toggleBtn.innerText = "Mở lại vé"; }
        }
    },

    sendMessage: async (e) => {
        e.preventDefault();
        const input = document.getElementById('ticket-input');
        const text = input.value.trim();
        const tId = app.ticket.currentTicketId;
        if (!text || !tId) return;
        const isManager = app.role === 'admin' || app.role === 'manager';
        input.value = '';

        const msgRef = app.ticket.db.ref(\`ticket_messages/\${tId}\`).push();
        const msgData = {
            id: msgRef.key, sender_id: app.user.id, sender_name: app.username,
            sender_avatar: app.user.user_metadata?.avatar_url || 'https://files.catbox.moe/zzh1q1.png',
            sender_role: app.role, text: text, timestamp: Date.now()
        };

        try {
            await msgRef.set(msgData);
            const tRef = app.ticket.db.ref(\`tickets/\${tId}\`);
            tRef.child(isManager ? 'unread_user' : 'unread_manager').transaction((currentVal) => (currentVal || 0) + 1);
            await tRef.update({ last_message: text, last_updated: Date.now() });
            app.ticket.db.ref(\`tickets/\${tId}/typing/\${app.user.id}\`).remove();
        } catch (err) { app.ui.showAlert("Lỗi gửi tin nhắn: " + err.message); }
    },

    toggleStatus: async () => {
        if (!app.ticket.currentTicketId) return;
        const tData = app.ticket.ticketsData[app.ticket.currentTicketId];
        const newStatus = tData.status === 'open' ? 'closed' : 'open';
        try { await app.ticket.db.ref(\`tickets/\${app.ticket.currentTicketId}\`).update({ status: newStatus }); } 
        catch (e) { app.ui.showAlert("Lỗi đổi trạng thái: " + e.message); }
    }
};`;

const startTicketObj = html.indexOf('ticket: {');
const endTicketObj = html.indexOf('toast: {');
if (startTicketObj !== -1 && endTicketObj !== -1) {
    html = html.substring(0, startTicketObj) + newTicketObject + '\n            ' + html.substring(endTicketObj);
    console.log("Chunk 8 Ticket Object Applied.");
}

fs.writeFileSync('_core.html', html, 'utf8');
console.log("File updated successfully.");
