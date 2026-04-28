// File: api/bug-report.js

export default async function handler(req, res) {
    // Chỉ nhận method POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { DISCORD_BOT_TOKEN, BUG_CHANNEL } = process.env;

    if (!DISCORD_BOT_TOKEN || !BUG_CHANNEL) {
        console.error("Thiếu DISCORD_BOT_TOKEN hoặc BUG_CHANNEL trong Environment Variables");
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const { errorMessage, fileInfo, consoleLogs, user, userAgent } = req.body;

    // Chuẩn bị nội dung Embed gửi sang Discord
    const embed = {
        title: "🚨 Báo cáo lỗi Upload tự động",
        color: 0xff0000, // Màu đỏ
        fields:[
            { 
                name: "📝 Chi tiết lỗi", 
                value: `\`\`\`\n${errorMessage || "Không có thông báo lỗi cụ thể"}\n\`\`\``, 
                inline: false 
            },
            { 
                name: "👤 Người dùng", 
                value: user ? `**${user.username}**\n\`${user.id}\`` : "Guest / Khách", 
                inline: true 
            },
            { 
                name: "🌐 Trình duyệt / Thiết bị", 
                value: `\`${userAgent || "Unknown"}\``, 
                inline: false 
            }
        ],
        timestamp: new Date().toISOString()
    };

    // Thêm thông tin File nếu có
    if (fileInfo) {
        embed.fields.splice(1, 0, {
            name: "📁 Thông tin File",
            value: `**Tên file:** ${fileInfo.name || 'N/A'}\n**Loại:** ${fileInfo.type || 'N/A'}\n**Cỡ gốc:** ${fileInfo.originalSize ? fileInfo.originalSize + ' KB' : 'N/A'}\n**Cỡ sau nén:** ${fileInfo.compressedSize ? fileInfo.compressedSize + ' KB' : 'Chưa kịp nén (Lỗi trước đó)'}`,
            inline: true
        });
    }

    // Thêm log console đỏ nếu có
    if (consoleLogs && consoleLogs.length > 0) {
        // Lấy 5 lỗi gần nhất, cắt ngắn nếu quá dài tránh lỗi API Discord
        const logsStr = consoleLogs.slice(-5).join('\n').substring(0, 1000);
        embed.fields.push({
            name: "🔴 Console Errors (Cảnh báo đỏ)",
            value: `\`\`\`js\n${logsStr}\n\`\`\``,
            inline: false
        });
    }

    try {
        // Dùng Discord REST API để gửi tin nhắn bằng Bot Token (Không dùng Webhook)
        const discordRes = await fetch(`https://discord.com/api/v10/channels/${BUG_CHANNEL}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ embeds: [embed] })
        });

        if (!discordRes.ok) {
            const errorText = await discordRes.text();
            throw new Error(`Discord API Error: ${errorText}`);
        }

        return res.status(200).json({ success: true, message: "Bug reported successfully" });
    } catch (err) {
        console.error("Lỗi khi gửi report tới Discord:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
}