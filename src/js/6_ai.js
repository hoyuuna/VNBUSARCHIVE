window.app = window.app || {};

Object.assign(window.app, {
    ai: {
        moderateBio: async (text) => {
            try {
                // Lấy Token của user để chống spam API (nếu cần)
                const { data: { session } } = await window.sb.auth.getSession();
                const token = session?.access_token;

                const res = await fetch('/api/moderate-bio', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` // Tùy chọn bảo mật thêm
                    },
                    body: JSON.stringify({ text: text })
                });

                if (!res.ok) throw new Error('Không thể kết nối đến máy chủ kiểm duyệt.');

                const data = await res.json();
                return data; // Trả về dạng { is_safe: boolean, reason: string }

            } catch (e) {
                console.error("AI Check failed:", e);
                // Nếu lỗi mạng, mặc định cho qua để không làm kẹt tính năng
                return { is_safe: true, reason: "" }; 
            }
        }
    }
});
