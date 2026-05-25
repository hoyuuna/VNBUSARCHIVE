const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(200).send('OK');

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

    if (!botToken || !supabaseUrl || !supabaseKey) {
        console.error("LỖI: Thiếu biến môi trường (ENV) trên Vercel!");
        return res.status(200).send('OK');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const payload = req.body;

    try {
        // ====================================================================
        // NHIỆM VỤ 1: NHẬN WEBHOOK TỪ TELEGRAM (Lúc user ấn nút /start)
        // ====================================================================
        if (payload.message && payload.message.text) {
            const chatId = payload.message.chat.id;
            const text = payload.message.text;

            if (text.startsWith('/start')) {
                const parts = text.split(' ');
                const userId = parts.length > 1 ? parts[1] : null;

                let replyText = "";

                if (userId && userId.length > 10) {
                    const { data, error: fetchErr } = await supabase.from('profiles').select('notif_config').eq('id', userId).single();
                    
                    if (fetchErr && fetchErr.code !== 'PGRST116') {
                        replyText = `❌ *LỖI HỆ THỐNG:*\nKhông thể truy xuất dữ liệu từ máy chủ. Vui lòng thử lại sau.`;
                    } else {
                        let currentConfig = data?.notif_config || { enabled: true, approved: true, denied: true, system: true };
                        currentConfig.chat_id = chatId;

                        const { error: updateErr } = await supabase.from('profiles').update({ notif_config: currentConfig }).eq('id', userId);

                        if (updateErr) {
                            replyText = `❌ *LỖI KẾT NỐI:*\nMã tài khoản không hợp lệ hoặc đã bị xóa.`;
                        } else {
                            replyText = `✅ *KẾT NỐI THÀNH CÔNG!*\n\nTài khoản của bạn đã được liên kết với Telegram.\n\n👉 *Vui lòng quay lại trình duyệt web và Tải lại trang (Reload) để cập nhật trạng thái.*\n\nTừ giờ, hệ thống sẽ gửi các thông báo quan trọng thẳng vào đoạn chat này.`;
                        }
                    }
                } else {
                    replyText = `⚠️ *LỖI CÚ PHÁP:*\nBạn chưa cung cấp mã định danh tài khoản.\n\n👉 Vui lòng truy cập lại Cài đặt trên Website VNBUSARCHIVE và bấm nút *Kết nối Telegram* để thử lại.`;
                }

                await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, text: replyText, parse_mode: 'Markdown' })
                });
            }
            return res.status(200).send('OK');
        }

        // ====================================================================
        // NHIỆM VỤ 2: GỬI THÔNG BÁO TỪ WEBSITE
        // ====================================================================
        if (payload.action === 'notify' && payload.userId && payload.message) {
            const { userId, message } = payload;
            const { data } = await supabase.from('profiles').select('notif_config').eq('id', userId).single();
            const config = data?.notif_config;

            if (!config || !config.chat_id) return res.status(200).json({ error: 'User chưa kết nối Telegram' });
            if (!config.enabled) return res.status(200).json({ skipped: true, reason: 'User đã tắt toàn bộ thông báo' });
            
            const msgLower = message.toLowerCase();
            if (msgLower.includes('được duyệt') && msgLower.includes('ảnh') && !config.approved) return res.status(200).json({ skipped: true });
            if ((msgLower.includes('từ chối') || msgLower.includes('xóa')) && !config.denied) return res.status(200).json({ skipped: true });
            if (msgLower.includes('chỉnh sửa') && msgLower.includes('được duyệt') && !config.system) return res.status(200).json({ skipped: true });

            const tgResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: config.chat_id,
                    text: `🔔 *VNBUSARCHIVE*\n\n${message}`,
                    parse_mode: 'Markdown'
                })
            });

            return res.status(200).json({ success: true, tgResponse: await tgResponse.json() });
        }

        return res.status(200).send('OK');
    } catch (error) {
        console.error('API Error:', error);
        return res.status(200).send('OK');
    }
};