import { MongoClient } from "mongodb";

let cachedClient = null;

export async function getDb(env) {
    if (cachedClient) {
        return cachedClient.db("vnbusarchive_db");
    }
    
    const uri = env.MONGO_URI || "mongodb+srv://nghoanganhtuann_db_user:YOUR_PASSWORD@cluster0.cr6xzmm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
    
    // Tăng timeout lên 20 giây để bù đắp độ trễ cáp quang / định tuyến TLS
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 20000, connectTimeoutMS: 20000 });
    
    try {
        await client.connect();
    } catch (err) {
        throw new Error("MongoDB Connect Error: " + err.message + " | URI Prefix: " + uri.substring(0, 20) + "...");
    }
    
    cachedClient = client;
    return client.db("vnbusarchive_db");
}

export async function getNextSequenceValue(db, sequenceName) {
    const sequenceDocument = await db.collection("counters").findOneAndUpdate(
        { _id: sequenceName },
        { $inc: { sequence_value: 1 } },
        { returnDocument: "after", upsert: true }
    );
    return sequenceDocument.sequence_value;
}

