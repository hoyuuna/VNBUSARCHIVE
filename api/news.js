// Fetch latest messages from a Discord channel and expose as news feed
export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    const token = process.env.DISCORD_BOT_TOKEN;
    const channelId = process.env.DISCORD_CHANNEL_ID;

    if (!token || !channelId) {
        return res.status(500).json({ error: 'Missing DISCORD_BOT_TOKEN or DISCORD_CHANNEL_ID' });
    }

    try {
        const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages?limit=10`, {
            headers: { Authorization: `Bot ${token}` }
        });

        if (!response.ok) {
            throw new Error(`Discord API error: ${response.status}`);
        }

        const messages = await response.json();

        const formattedNews = messages.map((msg) => {
            let text = msg.content || '';

            text = text.replace(/<a?:(\w+):\d+>/g, ':$1:');
            text = text.replace(/<@!?\d+>/g, '@user');
            text = text.replace(/<#[^>]+>/g, '#kênh');
            text = text.replace(/<@&\d+>/g, '@role');

            const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
            let title = 'Thông báo hệ thống';
            if (lines.length > 0) {
                title = lines[0].replace(/[*_#]/g, '').trim();
                if (title.length > 60) title = `${title.substring(0, 60)}...`;
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

            let summary = text.replace(/\n/g, ' ').substring(0, 100);
            if (text.length > 100) summary += '...';

            const author = msg.author || {};
            const authorName = author.global_name || author.username || 'Ban Quản Trị';
            const avatarExtension = author.avatar?.startsWith('a_') ? 'gif' : 'png';
            const authorAvatar = author.id && author.avatar
                ? `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.${avatarExtension}?size=128`
                : 'https://wsrv.nl/?url=https://files.catbox.moe/zzh1q1.png&we';

            return {
                id: msg.id,
                title,
                summary: summary || 'Nhấn để xem chi tiết đính kèm...',
                date: dateStr,
                content: fullContent,
                authorName,
                authorAvatar
            };
        });

        return res.status(200).json(formattedNews);
    } catch (error) {
        console.error('News API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
