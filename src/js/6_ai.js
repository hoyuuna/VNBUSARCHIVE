window.app = window.app || {};

Object.assign(window.app, {
    ai: {
        moderateBio: async (text) => {
            try {
                // Lấy Token của user để chống spam API (Nếu Backend của bạn có check JWT)
                const { data: { session } } = await window.sb.auth.getSession();
                const token = session?.access_token;

                const res = await fetch('/api/moderate-bio', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({ text: text })
                });

                if (!res.ok) throw new Error('Máy chủ từ chối kết nối.');

                const data = await res.json();
                return data;

            } catch (e) {
                console.error("AI Check failed:", e);
                // ĐÚNG YÊU CẦU: Nếu AI lỗi (rớt mạng, hết quota...), chặn luôn không cho qua
                return { 
                    is_safe: false, 
                    reason: "Hệ thống kiểm duyệt AI đang bận hoặc mất kết nối. Vui lòng thử lại sau." 
                }; 
            }
        }
    }
});
