const fs = require('fs');
const envContent = fs.readFileSync('temp/middle/.dev.vars', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
        const [k, v] = line.split('=');
        if (k && v) env[k.trim()] = v.trim();
    }
});
const mongoUri = env['MONGO_URI'].replace(/['\"\s]/g, '');

const { MongoClient } = require('mongodb');
async function run() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db('vnbusarchive_db');
  
  let start = Date.now();
  const count = await db.collection('photos').countDocuments({ status: 'pending' });
  console.log('countDocuments took', Date.now() - start, 'ms', count);
  
  start = Date.now();
  const cursor = db.collection('photos').aggregate([
    { $match: { status: 'pending' } },
    { $lookup: { from: 'vehicles', localField: 'license_plate', foreignField: '_id', as: 'vehicles' } },
    { $unwind: { path: '$vehicles', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'users', localField: 'uploader_id', foreignField: '_id', as: 'profiles' } },
    { $unwind: { path: '$profiles', preserveNullAndEmptyArrays: true } },
    { $sort: { created_at: -1 } },
    { $skip: 0 },
    { $limit: 100 }
  ]);
  const arr = await cursor.toArray();
  console.log('aggregate took', Date.now() - start, 'ms', arr.length);
  
  await client.close();
}
run().catch(console.error);
