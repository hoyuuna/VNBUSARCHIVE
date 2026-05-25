import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(200).send('OK');

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

    if (!botToken || !supabaseUrl || !supabaseKey) return res.status(200).send('OK');

    const supabase = createClient(supabaseUrl, supabaseKey);
    const payload = req.body;

    try {
        // ====================================================================
        // NHIỆM VỤ 1: NHẬN WEBHOOK TỪ TELEGRAM (Lúc user ấn nút /start)
        // ====================================================================
        if (payload.message && payload.message.text) {
            const chatId = payload.message.chat.id;
            const text = payload.message.text;

            if (text.startsWith('/start ')) {
                const userId = text.split(' ')[1];

                if (userId && userId.length > 10) {
                    // Lấy cục JSON cấu hình hiện tại ra
                    const { data } = await supabase.from('profiles').select('notif_config').eq('id', userId).single();
                    let currentConfig = data?.notif_config || { enabled: true, approved: true, denied: true, system: true };
                    
                    // Nhồi ID chat vào trong JSON
                    currentConfig.chat_id = chatId;

                    // Lưu ngược lại lên Database
                    const { error } = await supabase.from('profiles').update({ notif_config: currentConfig }).eq('id', userId);

                    let replyText = error 
                        ? "❌ Đã có lỗi xảy ra. Vui lòng kiểm tra lại tài khoản." 
                        : "✅ *Liên kết thành công!*

Hệ thống sẽ gửi thông báo đến bạn tại đây.
Bạn có thể quay lại Website để tùy chỉnh Bật/Tắt các loại thông báo cụ thể.";
                    
                    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chat_id: chatId, text: replyText, parse_mode: 'Markdown' })
                    });
                }
            }
            return res.status(200).send('OK');
        }

        // ====================================================================
        // NHIỆM VỤ 2: GỬI THÔNG BÁO CHO USER (Do Website của bạn gọi tới)
        // ====================================================================
        if (payload.action === 'notify' && payload.userId && payload.message) {
            const { userId, message } = payload;

            const { data } = await supabase.from('profiles').select('notif_config').eq('id', userId).single();
            const config = data?.notif_config;

            // Nếu user chưa liên kết Telegram thì bỏ qua
            if (!config || !config.chat_id) return res.status(200).json({ error: 'User chưa kết nối Telegram' });

            // KIỂM TRA BỘ LỌC CỦA USER TRƯỚC KHI GỬI
            if (!config.enabled) return res.status(200).json({ skipped: true, reason: 'User đã tắt toàn bộ thông báo' });
            
            const msgLower = message.toLowerCase();
            if (msgLower.includes('được duyệt') && msgLower.includes('ảnh') && !config.approved) return res.status(200).json({ skipped: true });
            if ((msgLower.includes('từ chối') || msgLower.includes('xóa')) && !config.denied) return res.status(200).json({ skipped: true });
            if (msgLower.includes('chỉnh sửa') && msgLower.includes('được duyệt') && !config.system) return res.status(200).json({ skipped: true });

            // Nếu qua hết các bộ lọc thì bắn Telegram API
            const tgResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: config.chat_id,
                    text: `🔔 *VNBUSARCHIVE*

${message}`,
                    parse_mode: 'Markdown'
                })
            });

            return res.status(200).json({ success: true, tgResponse: await tgResponse.json() });
        }

        return res.status(200).send('OK');
    } catch (error) {
        console.error('API Error:', error);
        return res.status(200).send('OK'); // Luôn trả 200 để Telegram ko gửi lại webhook
    }
}
