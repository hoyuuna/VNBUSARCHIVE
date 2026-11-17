
async function handleSendEmail(request, env, body) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' }});

    // Forward request trực tiếp tới Middleware (nơi quản lý Resend API & Database auth users)
    const middlewareBase = env.SUPABASE_URL || 'https://vnbusarchive-middle-api.nghoanganhtuann.workers.dev';
    const fallbackBase = 'https://vnbusarchive-middle-api.nghoanganhtuann.workers.dev';

    let targetEndpoints = [
        `${middlewareBase.replace(/\/+$/, '')}/api/manager/send-email`
    ];
    if (middlewareBase.includes('api.vnbusarchive.io.vn')) {
        targetEndpoints = [`${fallbackBase}/api/manager/send-email`];
    }

    let lastError = null;
    for (const url of targetEndpoints) {
        try {
            const resp = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader,
                    'Origin': 'https://www.vnbusarchive.io.vn'
                },
                body: JSON.stringify(body)
            });

            if (resp.ok) {
                const resJson = await resp.json().catch(() => ({ success: true }));
                return new Response(JSON.stringify(resJson), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            } else {
                const errData = await resp.json().catch(() => ({ error: 'Lỗi gửi email từ Middleware' }));
                lastError = errData.error || errData.message || 'Lỗi gửi email';
                if (resp.status === 401 || resp.status === 403 || resp.status === 400 || resp.status === 404) {
                    return new Response(JSON.stringify({ error: lastError }), {
                        status: resp.status,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }
        } catch (e) {
            lastError = e.message;
        }
    }

    return new Response(JSON.stringify({ error: lastError || 'Không thể kết nối đến máy chủ email middleware' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
    });
}

async function handleBugReport(request, env, body) {
    const { DISCORD_BOT_TOKEN, BUG_CHANNEL } = env;

    if (!DISCORD_BOT_TOKEN || !BUG_CHANNEL) {
        console.error("Thiếu DISCORD_BOT_TOKEN hoặc BUG_CHANNEL trong Environment Variables");
        return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }

    const { errorMessage, fileInfo, consoleLogs, user, userAgent } = body;
    const sanitizeMentions = (str) => String(str ?? '').replace(/@(everyone|here)/gi, '@\u200b$1').replace(/<@&?\d+>/g, '[mention]');

    const embed = {
        title: "🚨 Báo cáo lỗi Upload tự động",
        color: 0xff0000,
        fields:[
            { 
                name: "📝 Chi tiết lỗi", 
                value: "```\n" + sanitizeMentions(errorMessage || "Không có thông báo lỗi cụ thể") + "\n```", 
                inline: false 
            },
            { 
                name: "👤 Người dùng", 
                value: user ? "**" + sanitizeMentions(user.username) + "**\n`" + user.id + "`" : "Guest / Khách", 
                inline: true 
            },
            { 
                name: "🌐 Trình duyệt / Thiết bị", 
                value: "`" + sanitizeMentions(userAgent || "Unknown") + "`", 
                inline: false 
            }
        ],
        timestamp: new Date().toISOString()
    };

    if (fileInfo) {
        embed.fields.splice(1, 0, {
            name: "📁 Thông tin File",
            value: "**Tên file:** " + sanitizeMentions(fileInfo.name || 'N/A') + "\n**Loại:** " + sanitizeMentions(fileInfo.type || 'N/A') + "\n**Cỡ gốc:** " + (fileInfo.originalSize ? fileInfo.originalSize + ' KB' : 'N/A') + "\n**Cỡ sau nén:** " + (fileInfo.compressedSize ? fileInfo.compressedSize + ' KB' : 'Chưa kịp nén (Lỗi trước đó)'),
            inline: true
        });
    }

    if (consoleLogs && consoleLogs.length > 0) {
        const logsStr = consoleLogs.slice(-5).join('\n').substring(0, 1000);
        embed.fields.push({
            name: "🔴 Console Errors (Cảnh báo đỏ)",
            value: "```js\n" + sanitizeMentions(logsStr) + "\n```",
            inline: false
        });
    }

    const discordRes = await fetch("https://discord.com/api/v10/channels/" + BUG_CHANNEL + "/messages", {
        method: 'POST',
        headers: {
            'Authorization': "Bot " + DISCORD_BOT_TOKEN,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ embeds: [embed] })
    });

    if (!discordRes.ok) {
        const errorText = await discordRes.text();
        throw new Error("Discord API Error: " + errorText);
    }

    return new Response(JSON.stringify({ success: true, message: "Bug reported successfully" }), { status: 200, headers: { 'Content-Type': 'application/json' }});
}

function validateOriginAndReferer(request) {
    const referer = request.headers.get('referer') || '';
    const origin = request.headers.get('origin') || '';
    const host = request.headers.get('host') || '';
    const isProduction = host.includes('vnbusarchive.io.vn');
    if (!isProduction) return true;
    if (!origin && !referer) return false;
    function checkDomain(str) {
        if (!str) return false;
        try {
            const u = new URL(str);
            return u.hostname === 'vnbusarchive.io.vn' || u.hostname.endsWith('.vnbusarchive.io.vn');
        } catch (e) {
            return false;
        }
    }
    return checkDomain(origin) || checkDomain(referer);
}

export async function onRequest(context) {
    const { request, env } = context;
    if (!validateOriginAndReferer(request)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' }});
    if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' }});

    try {
        const body = await request.json().catch(() => ({}));
        const { action } = body;
        
        if (action === 'email') {
            return await handleSendEmail(request, env, body);
        } else if (action === 'bug') {
            return await handleBugReport(request, env, body);
        } else {
            return new Response(JSON.stringify({ error: 'Invalid or missing action in payload' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
        }
    } catch (error) {
        console.error('Lỗi API Notify:', error);
        return new Response(JSON.stringify({ error: "Đã xảy ra lỗi hệ thống, vui lòng thử lại sau" }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }
}
