
import { getDb, getNextSequenceValue } from "./_db.js";
import { verifyToken } from "./_jwt.js";

function buildMongoFilter(filters) {
    const query = {};
    for (const f of filters) {
        if (f.type === "eq") query[f.column] = f.value;
        else if (f.type === "neq") query[f.column] = { $ne: f.value };
        else if (f.type === "in") query[f.column] = { $in: f.value };
        else if (f.type === "is") {
            if (f.value === null) query[f.column] = null;
        }
        
        else if (f.type === "or") {
            const parseCond = (condStr) => {
                if (condStr.startsWith("and(")) {
                    const inner = condStr.slice(4, -1).split(",");
                    return { "$and": inner.map(parseCond) };
                }
                const match = condStr.match(/([a-zA-Z0-9_]+)\.(eq|neq|ilike|is)\.(.+)/);
                if (match) {
                    const [_, field, op, val] = match;
                    let parsedVal = val.replace(/^"|"$/g, "");
                    if (parsedVal === "null") parsedVal = null;
                    if (op === "eq") return { [field]: parsedVal };
                    if (op === "neq") return { [field]: { "$ne": parsedVal } };
                    if (op === "is") return { [field]: parsedVal };
                    if (op === "ilike") return { [field]: { "$regex": new RegExp(parsedVal.replace(/%/g, ".*"), "i") } };
                }
                return {};
            };
            const orConditions = [];
            const parts = f.condition.match(/(and\([^)]+\)|[^,]+)/g) || [];
            parts.forEach(p => orConditions.push(parseCond(p)));
            
            if (query["$or"]) {
                query["$and"] = query["$and"] || [];
                query["$and"].push({ "$or": orConditions });
            } else {
                query["$or"] = orConditions;
            }
        }
        else if (f.type === "ilike") {
            const regex = new RegExp(f.value.replace(/%/g, ".*"), "i");
            query[f.column] = { $regex: regex };
        }
    }
    return query;
}

export async function onRequestPost(context) {
    try {
        const body = await context.request.json();
        const { table, action, select, options, filters, order, limit, skip, single, data } = body;
        
        const authHeader = context.request.headers.get("Authorization");
        let user = null;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            user = await verifyToken(authHeader.split(" ")[1], context.env);
        }

        // Basic RBAC
        const adminTables = ["system_settings"];
        if (adminTables.includes(table) && (!user || (user.role !== "admin" && user.role !== "manager"))) {
            return new Response(JSON.stringify({ error: "Access denied", data: null }), { status: 403 });
        }

        const db = await getDb(context.env);
        const col = db.collection(table);
        const mongoQuery = buildMongoFilter(filters || []);

        if (action === "select") {
            // Count query
            if (options && options.count) {
                const count = await col.countDocuments(mongoQuery);
                return new Response(JSON.stringify({ data: null, count, error: null }));
            }
            
            
            let aggregation = [{ $match: mongoQuery }];
            
            let hasJoins = false;
            if (select && select.includes("profiles(")) {
                hasJoins = true;
                aggregation.push({
                    $lookup: {
                        from: "users",
                        localField: (table === "comments" || table === "photo_comments") ? "user_id" : "uploader_id",
                        foreignField: "_id",
                        as: "profiles_arr"
                    }
                });
                aggregation.push({
                    $addFields: {
                        profiles: { $arrayElemAt: ["$profiles_arr", 0] }
                    }
                });
            }
            if (select && select.includes("vehicles(")) {
                hasJoins = true;
                aggregation.push({
                    $lookup: {
                        from: "vehicles",
                        localField: "license_plate",
                        foreignField: "_id",
                        as: "vehicles_arr"
                    }
                });
                aggregation.push({
                    $addFields: {
                        vehicles: { $arrayElemAt: ["$vehicles_arr", 0] }
                    }
                });
            }
            if (select && select.includes("photos!inner")) {
                hasJoins = true;
                aggregation.push({
                    $lookup: {
                        from: "photos",
                        localField: "_id",
                        foreignField: "license_plate",
                        as: "photos"
                    }
                });
                // Fake inner join by filtering out those with empty photos array
                if (mongoQuery["photos.status"]) {
                    aggregation.push({ $match: { "photos.status": mongoQuery["photos.status"] } });
                }
            }

            if (order) {
                aggregation.push({ $sort: { [order.column]: order.ascending ? 1 : -1 } });
            }
            if (skip) aggregation.push({ $skip: skip });
            if (limit) aggregation.push({ $limit: limit });
            
            let result = hasJoins ? await col.aggregate(aggregation).toArray() : await col.find(mongoQuery).sort(order ? { [order.column]: order.ascending ? 1 : -1 } : {}).skip(skip || 0).limit(limit || 1000).toArray();

            // Map _id back to id for frontend compatibility
            result = result.map(doc => {
                doc.id = doc._id;
                if (doc.profiles) doc.profiles.id = doc.profiles._id;
                if (doc.vehicles) doc.vehicles.id = doc.vehicles._id;
                return doc;
            });


            if (single) {
                return new Response(JSON.stringify({ data: result.length > 0 ? result[0] : null, error: null }));
            }
            return new Response(JSON.stringify({ data: result, error: null }));
            
        } else if (action === "insert") {
            if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            
            let docs = Array.isArray(data) ? data : [data];
            // Assign IDs if missing
            for (let doc of docs) {
                if (!doc._id && !doc.id) {
                    if (table === "photos" || table === "photo_comments" || table === "photo_likes") {
                        doc._id = await getNextSequenceValue(db, table + "_id");
                        doc.id = doc._id;
                    } else {
                        doc._id = crypto.randomUUID();
                        doc.id = doc._id;
                    }
                }
            }
            
            await col.insertMany(docs);
            return new Response(JSON.stringify({ data: docs, error: null }));

        } else if (action === "update") {
            if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            await col.updateMany(mongoQuery, { $set: data });
            return new Response(JSON.stringify({ data: null, error: null }));
            
        } else if (action === "delete") {
            if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            await col.deleteMany(mongoQuery);
            return new Response(JSON.stringify({ data: null, error: null }));
        }

        return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400 });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message, data: null }), { status: 500 });
    }
}
