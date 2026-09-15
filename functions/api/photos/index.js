
import { getDb } from "../_db.js";

export async function onRequestGet(context) {
    try {
        const url = new URL(context.request.url);
        const limit = parseInt(url.searchParams.get("limit") || "20");
        const skip = parseInt(url.searchParams.get("skip") || "0");
        const status = url.searchParams.get("status");
        const license_plate = url.searchParams.get("license_plate");
        const uploader_id = url.searchParams.get("uploader_id");
        
        const query = {};
        if (status) query.status = status;
        if (license_plate) query.license_plate = license_plate;
        if (uploader_id) query.uploader_id = uploader_id;

        const db = await getDb(context.env);
        const photos = await db.collection("photos")
            .find(query)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        // Also fetch user details for each photo if needed, or leave it to frontend.
        return new Response(JSON.stringify(photos), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (e) {
        return new Response(JSON.stringify({ error: "Lỗi máy chủ nội bộ" }), { status: 500 });
    }
}
