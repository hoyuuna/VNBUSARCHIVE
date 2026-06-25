const fs = require('fs');

let html = fs.readFileSync('_core.html', 'utf8');

// 1. In app.ticket, force isManager = false to decouple it completely
html = html.replace(/const isManager = app\.role === 'admin' \|\| app\.role === 'manager';/g, 'const isManager = false; // Luôn là false ở /ticket (Độc lập)');

// 2. Replace the loadTab('tickets') block with the new Admin Ticket UI
const loadTabSearch = `                        } else if (tab === 'tickets') {
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

const loadTabReplace = `                        } else if (tab === 'tickets') {
                            content.className = "col-span-full";
                            content.innerHTML = \`
                                <div class="col-span-full h-[80vh] flex bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden relative">
                                    <!-- CỘT TRÁI: DANH SÁCH TICKET ADMIN -->
                                    <div id="adm-ticket-sidebar" class="w-full md:w-1/3 h-full flex flex-col bg-gray-50/50 border-r border-gray-200 shrink-0 z-10 transition-transform duration-300">
                                        <div class="p-4 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
                                            <h2 class="font-bold text-lg uppercase tracking-tight text-black">Quản lý Hỗ trợ</h2>
                                        </div>
                                        <div id="adm-ticket-list" class="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                                            <p class="text-center text-gray-400 py-10 text-xs"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang kết nối...</p>
                                        </div>
                                    </div>
                                    <!-- CỘT PHẢI: KHUNG CHAT ADMIN -->
                                    <div id="adm-ticket-chat-area" class="absolute md:relative inset-0 md:inset-auto w-full md:w-2/3 h-full flex flex-col bg-white overflow-hidden z-20 transform translate-x-full md:translate-x-0 transition-transform duration-300 hidden md:flex">
                                        <div id="adm-ticket-empty-state" class="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-30">
                                            <div class="w-16 h-16 bg-white border border-gray-200 rounded-full flex items-center justify-center text-2xl text-gray-300 mb-3 shadow-sm"><i class="fa-solid fa-headset"></i></div>
                                            <p class="text-sm font-bold text-gray-500">Chọn một vé để bắt đầu hỗ trợ người dùng</p>
                                        </div>
                                        <!-- Header Chat Admin -->
                                        <div class="p-3 md:p-4 border-b border-gray-100 bg-white flex items-center gap-3 shrink-0 shadow-sm relative z-20">
                                            <button onclick="app.admin.ticket.closeMobileChat()" class="md:hidden text-gray-500 hover:text-black p-2"><i class="fa-solid fa-arrow-left text-lg"></i></button>
                                            <div class="flex-1 overflow-hidden">
                                                <div class="flex items-center gap-2">
                                                    <h3 id="adm-ticket-chat-title" class="font-bold text-sm md:text-base text-black font-mono">#------</h3>
                                                    <span id="adm-ticket-chat-status" class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500">Đang tải</span>
                                                </div>
                                                <p id="adm-ticket-typing-indicator" class="text-[11px] text-gray-500 italic mt-0.5 h-4 opacity-0 transition-opacity">Khách hàng đang nhập...</p>
                                            </div>
                                            <button id="adm-btn-toggle-ticket-status" onclick="app.admin.ticket.toggleStatus()" class="border border-gray-300 bg-white text-black hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm whitespace-nowrap">Đóng vé</button>
                                        </div>
                                        <!-- Nội dung Chat Admin -->
                                        <div id="adm-ticket-messages" class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30 custom-scrollbar"></div>
                                        <!-- Khung nhập Admin -->
                                        <div id="adm-ticket-input-wrapper" class="p-3 md:p-4 bg-white border-t border-gray-100 shrink-0">
                                            <div id="adm-ticket-closed-msg" class="hidden text-center text-xs text-red-500 font-bold bg-red-50 py-3 rounded-xl border border-red-100">
                                                <i class="fa-solid fa-lock mr-1"></i> Vé hỗ trợ này đã đóng. Không thể gửi thêm tin nhắn.
                                            </div>
                                            <form id="adm-ticket-chat-form" class="flex gap-2" onsubmit="app.admin.ticket.sendMessage(event)">
                                                <input type="text" id="adm-ticket-input" class="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all text-black" placeholder="Nhập tin nhắn hỗ trợ..." autocomplete="off">
                                                <button type="submit" class="bg-black text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                                    <i class="fa-solid fa-paper-plane"></i>
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            \`;
                            app.ticket.initFirebase().then(() => {
                                app.admin.ticket.loadTicketList();
                            });
                        } else if (tab === 'manager') {`;

if(html.includes(loadTabSearch)) {
    html = html.replace(loadTabSearch, loadTabReplace);
}

// 3. Inject app.admin.ticket logic inside app.admin = { ... }
// We can find `checkNotification: () => {` and insert `ticket: { ... },` before it.
const adminLogicSearch = `checkNotification: () => {`;
const adminTicketLogic = `ticket: {
        currentTicketId: null,
        listeners: {},
        typingTimeout: null,
        ticketsData: {},
        
        loadTicketList: () => {
            const listEl = document.getElementById('adm-ticket-list');
            if (!listEl) return;
            const ref = app.ticket.db.ref('tickets');
            if (app.admin.ticket.listeners['list']) ref.off('value', app.admin.ticket.listeners['list']);

            const callback = ref.on('value', (snapshot) => {
                const data = snapshot.val();
                if (!data) {
                    listEl.innerHTML = '<p class="text-center text-gray-400 py-10 text-xs font-medium">Chưa có vé hỗ trợ nào.</p>';
                    return;
                }

                let ticketsArray = Object.values(data);
                ticketsArray.sort((a, b) => b.last_updated - a.last_updated);

                app.admin.ticket.ticketsData = {};
                ticketsArray.forEach(t => app.admin.ticket.ticketsData[t.id] = t);

                listEl.innerHTML = ticketsArray.map(t => {
                    const isActive = app.admin.ticket.currentTicketId === t.id;
                    const unreadCount = t.unread_manager || 0;
                    const unreadBadge = unreadCount > 0 ? \`<span class="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1">\${unreadCount}</span>\` : '';
                    const statusBadge = t.status === 'open' 
                        ? '<span class="text-[9px] font-bold text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded uppercase">Mở</span>'
                        : '<span class="text-[9px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded uppercase">Đóng</span>';
                    const avatarUrl = t.creator_avatar || 'https://files.catbox.moe/zzh1q1.png';

                    return \`
                        <div onclick="app.admin.ticket.openChat('\${t.id}')" class="p-3 rounded-xl border cursor-pointer transition-all \${isActive ? 'bg-blue-50 border-blue-400 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-400'}">
                            <div class="flex items-center justify-between mb-2">
                                <div class="font-mono text-sm font-black text-black">#\${t.id}</div>
                                <div class="flex items-center">\${statusBadge} \${unreadBadge}</div>
                            </div>
                            <div class="flex items-center gap-2">
                                <img src="\${avatarUrl}" class="w-6 h-6 rounded-full object-cover bg-gray-100 shrink-0">
                                <div class="overflow-hidden">
                                    <p class="text-xs font-bold text-gray-800 truncate">\${app.utils.cleanText(t.creator_name)}</p>
                                    <p class="text-[10px] text-gray-500 truncate mt-0.5">\${app.utils.cleanText(t.last_message || '')}</p>
                                </div>
                            </div>
                        </div>
                    \`;
                }).join('');
                
                if (app.admin.ticket.currentTicketId) app.admin.ticket.updateChatHeader(app.admin.ticket.ticketsData[app.admin.ticket.currentTicketId]);
            });
            app.admin.ticket.listeners['list'] = callback;
        },

        openChat: (ticketId) => {
            app.admin.ticket.currentTicketId = ticketId;
            const tData = app.admin.ticket.ticketsData[ticketId];

            document.getElementById('adm-ticket-empty-state').classList.add('hidden');
            app.admin.ticket.updateChatHeader(tData);

            document.getElementById('adm-ticket-sidebar').classList.add('hidden', 'md:flex');
            const chatArea = document.getElementById('adm-ticket-chat-area');
            chatArea.classList.remove('hidden');
            chatArea.classList.add('flex');

            const msgContainer = document.getElementById('adm-ticket-messages');
            msgContainer.innerHTML = '';
            
            if (app.admin.ticket.listeners['messages']) app.ticket.db.ref(\`ticket_messages/\${app.admin.ticket.listeners['prev_id']}\`).off('child_added', app.admin.ticket.listeners['messages']);

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
            app.admin.ticket.listeners['messages'] = msgCallback;
            app.admin.ticket.listeners['prev_id'] = ticketId;

            app.ticket.db.ref(\`tickets/\${ticketId}/unread_manager\`).set(0);

            const inputEl = document.getElementById('adm-ticket-input');
            inputEl.oninput = () => {
                app.ticket.db.ref(\`tickets/\${ticketId}/typing/\${app.user.id}\`).set(Date.now());
                if (app.admin.ticket.typingTimeout) clearTimeout(app.admin.ticket.typingTimeout);
                app.admin.ticket.typingTimeout = setTimeout(() => { app.ticket.db.ref(\`tickets/\${ticketId}/typing/\${app.user.id}\`).remove(); }, 2000);
            };

            if (app.admin.ticket.listeners['typing']) app.ticket.db.ref(\`tickets/\${app.admin.ticket.listeners['prev_id']}/typing\`).off('value', app.admin.ticket.listeners['typing']);
            const typingIndicator = document.getElementById('adm-ticket-typing-indicator');
            const typingCallback = app.ticket.db.ref(\`tickets/\${ticketId}/typing\`).on('value', (snapshot) => {
                const typers = snapshot.val();
                let isTyping = false;
                if (typers) { Object.keys(typers).forEach(uid => { if (uid !== app.user.id) isTyping = true; }); }
                if (isTyping) typingIndicator.classList.remove('opacity-0');
                else typingIndicator.classList.add('opacity-0');
            });
            app.admin.ticket.listeners['typing'] = typingCallback;

            app.admin.ticket.loadTicketList();
        },

        closeMobileChat: () => {
            document.getElementById('adm-ticket-sidebar').classList.remove('hidden', 'md:flex');
            document.getElementById('adm-ticket-sidebar').classList.add('flex');
            document.getElementById('adm-ticket-chat-area').classList.add('hidden');
            document.getElementById('adm-ticket-chat-area').classList.remove('flex');
            app.admin.ticket.currentTicketId = null;
            app.admin.ticket.loadTicketList();
        },

        updateChatHeader: (tData) => {
            if (!tData) return;
            document.getElementById('adm-ticket-chat-title').innerText = \`#\${tData.id}\`;
            const statusEl = document.getElementById('adm-ticket-chat-status');
            const formEl = document.getElementById('adm-ticket-chat-form');
            const closedMsg = document.getElementById('adm-ticket-closed-msg');
            const toggleBtn = document.getElementById('adm-btn-toggle-ticket-status');

            if (tData.status === 'open') {
                statusEl.innerText = 'Đang mở';
                statusEl.className = 'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-600 border border-green-200';
                formEl.classList.remove('hidden'); closedMsg.classList.add('hidden');
                toggleBtn.innerText = "Đóng vé";
            } else {
                statusEl.innerText = 'Đã đóng';
                statusEl.className = 'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 border border-gray-200';
                formEl.classList.add('hidden'); closedMsg.classList.remove('hidden');
                toggleBtn.innerText = "Mở lại vé";
            }
        },

        sendMessage: async (e) => {
            e.preventDefault();
            const input = document.getElementById('adm-ticket-input');
            const text = input.value.trim();
            const tId = app.admin.ticket.currentTicketId;
            if (!text || !tId) return;
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
                tRef.child('unread_user').transaction((currentVal) => (currentVal || 0) + 1);
                await tRef.update({ last_message: text, last_updated: Date.now() });
                app.ticket.db.ref(\`tickets/\${tId}/typing/\${app.user.id}\`).remove();
            } catch (err) { app.ui.showAlert("Lỗi gửi tin nhắn: " + err.message); }
        },

        toggleStatus: async () => {
            if (!app.admin.ticket.currentTicketId) return;
            const tData = app.admin.ticket.ticketsData[app.admin.ticket.currentTicketId];
            const newStatus = tData.status === 'open' ? 'closed' : 'open';
            try { await app.ticket.db.ref(\`tickets/\${app.admin.ticket.currentTicketId}\`).update({ status: newStatus }); } 
            catch (e) { app.ui.showAlert("Lỗi đổi trạng thái: " + e.message); }
        }
    },

    checkNotification: () => {`;

if (html.includes(adminLogicSearch)) {
    html = html.replace(adminLogicSearch, adminTicketLogic);
}

// 4. In Tailwind config, we already have ./_core.html. We just rewrite it again to ensure it's in the reset state.
// Wait, git reset undid tailwind.config.js modifications. I'll add it via regex.

fs.writeFileSync('_core.html', html, 'utf8');
console.log("Core html updated successfully.");
