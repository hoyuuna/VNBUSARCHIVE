
import { getDb, getNextSequenceValue } from "./_db.js";
import { verifyToken } from "./_jwt.js";

const sanitizeString = (str) => {
    if (typeof str !== "string") return str;
    return str
        .normalize("NFC")
        .replace(/\u0000/g, "")
        .replace(/\x00/g, "");
};

export async function onRequest(context) {
    const { request, env } = context;
    if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ success: false, error: "Chưa xác thực. Thiếu Token đăng nhập." }), { status: 401, headers: { "Content-Type": "application/json" }});
        }
        
        const token = authHeader.split(" ")[1];
        const user = await verifyToken(token, env);
        if (!user || !user.id) {
            return new Response(JSON.stringify({ success: false, error: "Phiên đăng nhập không hợp lệ." }), { status: 401, headers: { "Content-Type": "application/json" }});
        }
        const userId = user.id;

        const formData = await request.formData();
        const isAvatar = formData.get("isAvatar") === "true";
        
        const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "gif", "heic", "raw", "cr2", "cr3", "nef", "arw", "dng"];
        const rawExt = String(formData.get("fileExtension") || "jpg").toLowerCase();
        const fileExtension = ALLOWED_EXT.includes(rawExt) ? rawExt : "jpg";

        const metadata = {
            plate: sanitizeString(formData.get("meta_plate")),
            operator: sanitizeString(formData.get("meta_operator")),
            type: formData.get("meta_type"),
            route: sanitizeString(formData.get("meta_route")),
            model: sanitizeString(formData.get("meta_model")),
            location: sanitizeString(formData.get("meta_location")),
            note: sanitizeString(formData.get("meta_note")),
            taken_at: formData.get("meta_taken_at") ? new Date(formData.get("meta_taken_at")) : null,
            username: sanitizeString(formData.get("meta_username")),
            camera_model: sanitizeString(formData.get("meta_camera_model")),
            exif_params: sanitizeString(formData.get("meta_exif_params")),
            suspected_exif_fraud: formData.get("meta_suspected_exif_fraud") === "true"
        };

        const file = formData.get("file");
        if (!file || typeof file === "string") {
            return new Response(JSON.stringify({ success: false, error: "Ảnh tải lên bị rỗng. Vui lòng thử lại." }), { status: 400, headers: { "Content-Type": "application/json" }});
        }

        const MAX_SIZE = 20 * 1024 * 1024;
        const ALLOWED_MIME = [
            "image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", 
            "image/tiff", "image/x-adobe-dng", "image/x-canon-cr2", "image/x-canon-cr3", 
            "image/x-nikon-nef", "image/x-sony-arw", "image/x-raw", "application/octet-stream"
        ];
        if (file.size > MAX_SIZE) {
            return new Response(JSON.stringify({ success: false, error: "File quá lớn (tối đa 20MB)." }), { status: 400, headers: { "Content-Type": "application/json" }});
        }
        if (!ALLOWED_MIME.includes(file.type)) {
            return new Response(JSON.stringify({ success: false, error: "Loại file không hợp lệ (chỉ chấp nhận ảnh và file RAW)." }), { status: 400, headers: { "Content-Type": "application/json" }});
        }

        const randomValues = crypto.getRandomValues(new Uint8Array(6));
        const safeHash = Array.from(randomValues).map(b => b.toString(16).padStart(2, "0")).join("");
        const fileName = `img_${Date.now()}_${safeHash}.${fileExtension}`;
        
        const newFormData = new FormData();
        newFormData.append("file", file, fileName);

        let finalOptimizedUrl = "";
        
        const db = await getDb(env);

        if (isAvatar) {
            const uploadResult = await fetch("https://cdn.vnbusarchive.io.vn/upload", {
                method: "POST",
                headers: { "Authorization": `Bearer ${env.CF_IMGBED_TOKEN}` },
                body: newFormData
            }).then(res => res.json());

            if (!uploadResult || !uploadResult[0] || !uploadResult[0].src) {
                throw new Error(`Lỗi phản hồi từ CDN: ${JSON.stringify(uploadResult)}`);
            }
            let rawSrc = uploadResult[0].src;
            finalOptimizedUrl = rawSrc.startsWith("/") ? `https://cdn.vnbusarchive.io.vn${rawSrc}` : rawSrc;

            const oldProfile = await db.collection("users").findOne({ _id: userId });
            const oldAvatarUrl = oldProfile ? oldProfile.avatar_url : null;

            if (oldAvatarUrl && oldAvatarUrl !== finalOptimizedUrl && oldAvatarUrl.includes("vnbusarchive")) {
                try {
                    const oldUrlObj = new URL(oldAvatarUrl);
                    const oldFileName = oldUrlObj.pathname.split("/").pop();
                    if (oldFileName) {
                        const safeFileName = encodeURIComponent(oldFileName);
                        await fetch(`https://cdn.vnbusarchive.io.vn/api/manage/delete/${safeFileName}`, {
                            method: "DELETE",
                            headers: { "Authorization": `Bearer ${env.CF_IMGBED_TOKEN}` }
                        }).catch(e => console.warn("[WARN] Lỗi mạng khi xóa avatar cũ:", e));
                    }
                } catch (delErr) {
                    console.warn("[WARN] Lỗi khi xử lý xóa avatar cũ:", delErr);
                }
            }

            await db.collection("users").updateOne({ _id: userId }, { $set: { avatar_url: finalOptimizedUrl } });

            return new Response(JSON.stringify({ success: true, url: finalOptimizedUrl }), { status: 200, headers: { "Content-Type": "application/json" }});
        } else {
            const uploadResult = await fetch("https://cdn.vnbusarchive.io.vn/upload", {
                method: "POST",
                headers: { "Authorization": `Bearer ${env.CF_IMGBED_TOKEN}` },
                body: newFormData
            }).then(res => res.json());

            if (!uploadResult || !uploadResult[0] || !uploadResult[0].src) {
                throw new Error(`Lỗi phản hồi từ CDN: ${JSON.stringify(uploadResult)}`);
            }
            let rawSrc = uploadResult[0].src;
            finalOptimizedUrl = rawSrc.startsWith("/") ? `https://cdn.vnbusarchive.io.vn${rawSrc}` : rawSrc;

            // Upsert Vehicle
            await db.collection("vehicles").updateOne(
                { _id: metadata.plate },
                { 
                    $setOnInsert: { 
                        _id: metadata.plate, 
                        model: metadata.model, 
                        note: null, 
                        history: [], 
                        created_at: new Date() 
                    } 
                },
                { upsert: true }
            );

            // Insert Photo
            const photoId = await getNextSequenceValue(db, "photo_id");
            
            await db.collection("photos").insertOne({
                _id: photoId,
                url: finalOptimizedUrl,
                uploader_id: userId,
                license_plate: metadata.plate,
                location: metadata.location,
                note: metadata.note,
                status: "pending",
                camera_model: metadata.camera_model,
                exif_params: metadata.exif_params,
                taken_at: metadata.taken_at,
                operator: metadata.operator,
                route_no: metadata.route,
                type: metadata.type,
                suspected_exif_fraud: metadata.suspected_exif_fraud,
                views: 0,
                liked_by_users: [],
                created_at: new Date()
            });

            return new Response(JSON.stringify({ success: true, url: finalOptimizedUrl }), { status: 200, headers: { "Content-Type": "application/json" }});
        }

    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: "Đã xảy ra lỗi hệ thống máy chủ, vui lòng thử lại sau."
        }), { status: 500, headers: { "Content-Type": "application/json" }});
    }
}
