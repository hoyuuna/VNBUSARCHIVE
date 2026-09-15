
import { getDb } from "../_db.js";
import { verifyToken, signToken } from "../_jwt.js";
import bcrypt from "bcryptjs";

export async function onRequestPost(context) {
    try {
        const authHeader = context.request.headers.get("Authorization");
        if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        const token = authHeader.split(" ")[1];
        const userPayload = await verifyToken(token, context.env);
        if (!userPayload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

        const body = await context.request.json();
        const db = await getDb(context.env);
        const user = await db.collection("users").findOne({ _id: userPayload.id });
        
        if (body.password && body.current_password) {
            const isValid = await bcrypt.compare(body.current_password, user.encrypted_password);
            if (!isValid) return new Response(JSON.stringify({ error: "Mật khẩu cũ không chính xác" }), { status: 400 });
            const newHashed = await bcrypt.hash(body.password, 10);
            await db.collection("users").updateOne({ _id: user.id }, { $set: { encrypted_password: newHashed } });
        } else if (body.email) {
            await db.collection("users").updateOne({ _id: user.id }, { $set: { email: body.email } });
        } else if (body.data && body.data.avatar_url !== undefined) {
            await db.collection("users").updateOne({ _id: user.id }, { $set: { avatar_url: body.data.avatar_url } });
        }

        return new Response(JSON.stringify({ data: { user: { ...user, ...body } }, error: null }));
    } catch (e) {
        return new Response(JSON.stringify({ error: "Lỗi hệ thống" }), { status: 500 });
    }
}
