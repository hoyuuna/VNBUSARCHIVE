const fs = require('fs');
let code = fs.readFileSync('temp/middle/src/routes/manager.ts', 'utf8');

const target = `const photoCountsCursor = await db.aggregate('photos', [
        { $match: { status: 'approved' } },
        { $group: { _id: '$uploader_id', count: { $sum: 1 } } }
      ]);
      const photoCounts = photoCountsCursor.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {});`;

code = code.replace(
    /const photos = await db\.find\('photos', { status: 'approved' }\)\s*const photoCounts = photos\.reduce\(\(acc: any, p: any\) => {\s*acc\[p\.uploader_id\] = \(acc\[p\.uploader_id\] \|\| 0\) \+ 1\s*return acc\s*}, {}\)/,
    target
);

fs.writeFileSync('temp/middle/src/routes/manager.ts', code);
