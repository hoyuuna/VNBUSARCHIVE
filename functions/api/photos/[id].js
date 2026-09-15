
import { getDb } from "../_db.js";
import { verifyToken } from "../_jwt.js";

export async function onRequestGet(context) {
    try {
        const id = parseInt(context.params.id);
        const db = await getDb(context.env);
        const photo = await db.collection("photos").findOne({ _id: id });
        if (!photo) {
            return new Response(JSON.stringify({ error: "Photo not found" }), { status: 404 });
        }
        return new Response(JSON.stringify(photo), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (e) {
        return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
    }
}

export async function onRequestPatch(context) {
    // For updating likes or views
    try {
        const id = parseInt(context.params.id);
        const body = await context.request.json();
        
        const db = await getDb(context.env);
        const updateDoc = {};
        
        if (body.action === "view") {
            updateDoc.$inc = { views: 1 };
        } else if (body.action === "like") {
            const authHeader = context.request.headers.get("Authorization");
            if (!authHeader) return new Response("Unauthorized", { status: 401 });
            const token = authHeader.split(" ")[1];
            const user = await verifyToken(token, context.env);
            if (!user) return new Response("Unauthorized", { status: 401 });
            
            updateDoc.$addToSet = { liked_by_users: user.id };
        } else if (body.action === "unlike") {
            const authHeader = context.request.headers.get("Authorization");
            if (!authHeader) return new Response("Unauthorized", { status: 401 });
            const token = authHeader.split(" ")[1];
            const user = await verifyToken(token, context.env);
            if (!user) return new Response("Unauthorized", { status: 401 });
            
            updateDoc.$pull = { liked_by_users: user.id };
        }
        
        if (Object.keys(updateDoc).length > 0) {
            await db.collection("photos").updateOne({ _id: id }, updateDoc);
        }

        const photo = await db.collection("photos").findOne({ _id: id });
        return new Response(JSON.stringify(photo), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (e) {
        return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
    }
}
