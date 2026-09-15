
import { getDb } from "../_db.js";
import { signToken } from "../_jwt.js";
import bcrypt from "bcryptjs";

export async function onRequestPost(context) {
    try {
        const body = await context.request.json();
        const { email, password, username } = body;

        if (!email || !password || !username) {
            return new Response(JSON.stringify({ error: "Thiếu thông tin đăng ký" }), { status: 400 });
        }

        const db = await getDb(context.env);
        const existing = await db.collection("users").findOne({ email: email });

        if (existing) {
            return new Response(JSON.stringify({ error: "Email này đã được sử dụng" }), { status: 400 });
        }

        const encrypted_password = await bcrypt.hash(password, 10);
        const userId = crypto.randomUUID(); // uuid v4

        const newUser = {
            _id: userId,
            email: email,
            encrypted_password: encrypted_password,
            username: username,
            role: "user",
            avatar_url: null,
            discord_custom_role_id: null,
            subroles: [],
            bio: null,
            ban_status: { banned: false, reason: "" },
            preferences: {},
            created_at: new Date()
        };

        await db.collection("users").insertOne(newUser);

        // Create token immediately to login
        const payload = {
            id: newUser._id,
            email: newUser.email,
            role: newUser.role
        };
        const token = await signToken(payload, context.env);

        return new Response(JSON.stringify({
            message: "Đăng ký thành công",
            token: token,
            user: {
                id: newUser._id,
                email: newUser.email,
                username: newUser.username,
                role: newUser.role,
                avatar_url: newUser.avatar_url
            }
        }), { status: 201, headers: { "Content-Type": "application/json" } });

    } catch (e) {
        return new Response(JSON.stringify({ error: "Lỗi máy chủ nội bộ" }), { status: 500 });
    }
}
