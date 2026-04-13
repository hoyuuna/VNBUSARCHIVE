import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { photoId, type } = req.body;

    if (type === 'photo_approved' && process.env.DISCORD_PUBLIC_WEBHOOK_URL) {
        // Lấy lại thông tin ảnh để build embed đẹp
        const { data: photo } = await supabase
            .from('photos')
            .select(`*, profiles(username), vehicles(*)`)
            .eq('id', photoId)
            .single();

        if (photo) {
            await fetch(process.env.DISCORD_PUBLIC_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: "Vietnam Bus Spotter",
                    content: "📸 **ẢNH MỚI ĐÃ ĐƯỢC DUYỆT!**",
                    embeds: [{
                        title: `${photo.license_plate} - ${photo.vehicles?.operator}`,
                        description: photo.note ? `"${photo.note}"` : "",
                        image: { url: photo.url },
                        color: 5763719, // Green
                        fields: [
                            { name: "Tác giả", value: photo.profiles?.username || "Ẩn danh", inline: true },
                            { name: "Loại xe", value: photo.vehicles?.type === 'coach' ? "Xe khách" : "Xe buýt", inline: true },
                            { name: "Xem chi tiết", value: `[Bấm vào đây để xem và like](https://vietnambusspotter.vercel.app)` }
                        ],
                        footer: { text: `VBS ID: ${photo.id}` },
                        timestamp: new Date().toISOString()
                    }]
                })
            });
        }
    }

    return res.status(200).json({ success: true });
}
