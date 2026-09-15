
import { MongoClient } from "mongodb";

let cachedClient = null;

export async function getDb(env) {
    if (cachedClient) {
        return cachedClient.db("vnbusarchive_db");
    }
    
    // Fallback to the provided URI if env var is missing, though env var is preferred
    const uri = env.MONGO_URI || "mongodb+srv://nghoanganhtuann_db_user:YOUR_PASSWORD@cluster0.cr6xzmm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
    
    const client = new MongoClient(uri);
    await client.connect();
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
