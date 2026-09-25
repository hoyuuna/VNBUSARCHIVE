const fs = require('fs');
const envContent = fs.readFileSync('temp/middle/.dev.vars', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
        const [k, v] = line.split('=');
        if (k && v) env[k.trim()] = v.trim();
    }
});

// Since the file has null bytes from UTF-16LE, we need to extract correctly
const hex = fs.readFileSync('temp/middle/.dev.vars').toString('hex');
let pass = '';
// Actually, let's just use regex to extract the mongo uri from UTF-16LE
const str = fs.readFileSync('temp/middle/.dev.vars').toString('utf16le');
const match = str.match(/MONGO_URI="([^"]+)"/);
if (match) {
    const mongoUri = match[1];
    console.log("URI starts with:", mongoUri.substring(0, 15));
    const { MongoClient } = require('mongodb');
    async function run() {
      const client = new MongoClient(mongoUri);
      await client.connect();
      const db = client.db('vnbusarchive_db');
      
      let start = Date.now();
      const count = await db.collection('photos').countDocuments({ status: 'pending' });
      console.log('countDocuments took', Date.now() - start, 'ms', count);
      
      await client.close();
    }
    run().catch(console.error);
} else {
    console.log("Not found");
}
