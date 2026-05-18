import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const filePath = path.join(process.cwd(), '_core.html');
        const coreHtml = fs.readFileSync(filePath, 'utf8');
        const encodedPayload = Buffer.from(coreHtml).toString('base64');
        res.status(200).json({ payload: encodedPayload });
    } catch (error) {
        console.error("Loi doc file core:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}