
import re

with open("functions/api/query.js", "r", encoding="utf-8") as f:
    content = f.read()

rpc_code = """
        } else if (action === "rpc") {
            const rpcName = body.rpcName;
            const args = body.rpcArgs || {};
            
            if (rpcName === "get_home_stats") {
                // Return stats
                const totalPhotos = await db.collection("photos").countDocuments({ status: "approved" });
                const totalUsers = await db.collection("profiles").countDocuments({});
                const totalVehicles = await db.collection("vehicles").countDocuments({});
                return new Response(JSON.stringify({ data: [{ total_photos: totalPhotos, total_users: totalUsers, total_vehicles: totalVehicles }], error: null }));
            } else if (rpcName === "get_operator_stats") {
                const operatorName = args.op_name;
                const total = await db.collection("photos").countDocuments({ operator: operatorName, status: "approved" });
                return new Response(JSON.stringify({ data: [{ total_photos: total }], error: null }));
            } else if (rpcName === "get_model_stats") {
                // need vehicles join
                const modelName = args.mdl_name;
                const agg = [
                    { $lookup: { from: "vehicles", localField: "license_plate", foreignField: "_id", as: "vehicle" } },
                    { $match: { status: "approved", "vehicle.model": modelName } },
                    { $count: "total" }
                ];
                const res = await db.collection("photos").aggregate(agg).toArray();
                const total = res.length > 0 ? res[0].total : 0;
                return new Response(JSON.stringify({ data: [{ total_photos: total }], error: null }));
            } else if (rpcName === "get_unique_routes") {
                const routes = await db.collection("photos").distinct("route_no", { status: "approved" });
                const filtered = routes.filter(r => r != null && r !== "");
                return new Response(JSON.stringify({ data: filtered.map(r => ({ route_no: r })), error: null }));
            }
            return new Response(JSON.stringify({ error: "Unknown RPC" }), { status: 400 });
"""

# inject before return new Response(JSON.stringify({ error: "Unknown action" })
content = content.replace("return new Response(JSON.stringify({ error: \"Unknown action\" })", rpc_code + "\n        return new Response(JSON.stringify({ error: \"Unknown action\" })")

with open("functions/api/query.js", "w", encoding="utf-8") as f:
    f.write(content)
print("query.js modified.")
