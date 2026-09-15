
import { getDb } from "../_db.js";
import { signToken } from "../_jwt.js";
import bcrypt from "bcryptjs";

export async function onRequestPost(context) {
    try {
        const body = await context.request.json();
        const { email, password } = body;

        if (!email || !password) {
            return new Response(JSON.stringify({ error: "Thiếu email hoặc mật khẩu" }), { status: 400 });
        }

        const db = await getDb(context.env);
        const user = await db.collection("users").findOne({ email: email });

        if (!user) {
            return new Response(JSON.stringify({ error: "Tài khoản không tồn tại" }), { status: 401 });
        }

        // Compare using bcrypt
        const isValid = await bcrypt.compare(password, user.encrypted_password);
        
        if (!isValid) {
            return new Response(JSON.stringify({ error: "Mật khẩu không chính xác" }), { status: 401 });
        }

        if (user.ban_status && user.ban_status.banned) {
            return new Response(JSON.stringify({ error: "Tài khoản của bạn đã bị khóa: " + user.ban_status.reason }), { status: 403 });
        }

        // Create Token
        const payload = {
            id: user._id,
            email: user.email,
            role: user.role
        };
        const token = await signToken(payload, context.env);

        return new Response(JSON.stringify({
            message: "Đăng nhập thành công",
            token: token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                role: user.role,
                avatar_url: user.avatar_url
            }
        }), {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: "Lỗi máy chủ nội bộ" }), { status: 500 });
    }
}
