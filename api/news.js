// Fetch latest messages from a Discord channel and expose as news/help feed
export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    const token = process.env.DISCORD_BOT_TOKEN;
    const type = req.query.type === 'help' ? 'help' : 'news';
    const channelId = type === 'help' ? process.env.DISCORD_HELP_CHANNEL_ID : process.env.DISCORD_CHANNEL_ID;
    const id = req.query.id;

    const requiredEnv = type === 'help'
        ? ['DISCORD_BOT_TOKEN', 'DISCORD_HELP_CHANNEL_ID']
        : ['DISCORD_BOT_TOKEN', 'DISCORD_CHANNEL_ID'];
    const missingEnv = requiredEnv.filter((name) => !process.env[name]);

    if (!token || !channelId) {
        return res.status(500).json({ error: `Missing ${missingEnv.join(', ')} in Environment Variables` });
    }

    try {
        let url = `https://discord.com/api/v10/channels/${channelId}/messages`;
        if (id) {
            url += `/${encodeURIComponent(id)}`;
        } else {
            url += `?limit=${type === 'help' ? 12 : 10}`;
        }

        const response = await fetch(url, {
            headers: { Authorization: `Bot ${token}` }
        });

        if (!response.ok) {
            throw new Error(`Discord API error: ${response.status}`);
        }

        const rawData = await response.json();
        const messages = Array.isArray(rawData) ? rawData : [rawData];

        const formattedData = messages.map((msg) => {
            let text = msg.content || '';

            text = text.replace(/<a?:(\w+):\d+>/g, ':$1:');
            text = text.replace(/<@!?\d+>/g, '@user');
            text = text.replace(/<#[^>]+>/g, '#kênh');
            text = text.replace(/<@&\d+>/g, '@role');

            const lines = text.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);

            let title = type === 'help' ? 'Hướng dẫn' : 'Thông báo hệ thống';
            if (lines.length > 0) {
                title = lines[0].replace(/[*_#]/g, '').trim();
                if (title.length > 70) title = `${title.substring(0, 70)}...`;
            }

            let fullContent = text;
            if (msg.attachments && msg.attachments.length > 0) {
                msg.attachments.forEach((att) => {
                    if (att.content_type && att.content_type.startsWith('image/')) {
                        fullContent += `\n\n![${att.filename}](${att.url})`;
                    }
                });
            }

            const dateObj = new Date(msg.timestamp);
            const dateStr = dateObj.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            const firstLine = lines[0] || '';
            let summaryRaw = firstLine ? text.replace(firstLine, '').replace(/\n/g, ' ').trim() : text.replace(/\n/g, ' ').trim();

            let summary = summaryRaw.substring(0, 150);
            if (summaryRaw.length > 150) summary += '...';

            const author = msg.author || {};
            const authorName = author.global_name || author.username || 'Ban Quản Trị';
            const avatarExtension = author.avatar?.startsWith('a_') ? 'gif' : 'png';
            const authorAvatar = author.id && author.avatar
                ? `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.${avatarExtension}?size=128`
                : 'https://wsrv.nl/?url=https://files.catbox.moe/zzh1q1.png&we';

            return {
                id: msg.id,
                title,
                summary: summary || 'Nhấn để xem chi tiết...',
                date: dateStr,
                content: fullContent,
                authorName,
                authorAvatar
            };
        });

        return res.status(200).json(id ? formattedData[0] : formattedData);
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
