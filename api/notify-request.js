export default async function handler(req, res) {
    // Chỉ nhận POST request
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { userId, message, heading = 'VNBUSARCHIVE' } = req.body;

    if (!userId || !message) {
        return res.status(400).json({ error: 'Thiếu userId hoặc message' });
    }

    // Lấy Key từ Vercel Environment Variables
    const appId = process.env.ONESIGNAL_APP_ID;
    const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

    if (!appId || !restApiKey) {
        console.error("Missing OneSignal ENV variables.");
        return res.status(500).json({ error: 'Chưa cấu hình OneSignal trên Vercel' });
    }

    try {
        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${restApiKey}`
            },
            body: JSON.stringify({
                app_id: appId,
                target_channel: "push",
                // Gửi dựa trên external_id (Chính là user.id của Supabase ta đã setup ở Frontend)
                include_aliases: {
                    external_id: [userId] 
                },
                headings: { "en": heading, "vi": heading },
                contents: { "en": message, "vi": message }
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('OneSignal Error Response:', data);
            return res.status(response.status).json({ error: 'Lỗi từ OneSignal', details: data });
        }

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Fetch Error:', error);
        return res.status(500).json({ error: 'Lỗi server (Internal Server Error)' });
    }
}
