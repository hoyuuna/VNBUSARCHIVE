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
  
  const indexes = await db.collection('photos').indexes();
  console.log('Photos indexes:', JSON.stringify(indexes, null, 2));
  
  await client.close();
}
run().catch(console.error);
