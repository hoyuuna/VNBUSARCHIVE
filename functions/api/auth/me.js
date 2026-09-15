
import { getDb } from "../_db.js";
import { verifyToken } from "../_jwt.js";

export async function onRequestGet(context) {
    try {
        const authHeader = context.request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const payload = await verifyToken(token, context.env);

        if (!payload || !payload.id) {
            return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
        }

        const db = await getDb(context.env);
        const user = await db.collection("users").findOne({ _id: payload.id });

        if (!user) {
            return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
        }
        
        if (user.ban_status && user.ban_status.banned) {
            return new Response(JSON.stringify({ error: "Banned" }), { status: 403 });
        }

        return new Response(JSON.stringify({
            id: user._id,
            email: user.email,
            username: user.username,
            role: user.role,
            avatar_url: user.avatar_url,
            bio: user.bio,
            preferences: user.preferences || {}
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: "Lỗi máy chủ nội bộ" }), { status: 500 });
    }
}
