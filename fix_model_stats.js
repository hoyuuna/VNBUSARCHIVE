const fs = require('fs');

let text = fs.readFileSync('temp/middle/src/routes/stats.ts', 'utf8');

text = text.replace(
    /const count = await db\.aggregate\('photos', \[\s*\{ \$match: \{ status: 'approved' \} \},\s*\{ \$lookup: \{ from: 'vehicles', localField: 'license_plate', foreignField: '_id', as: 'vehicle' \} \},\s*\{ \$unwind: '\$vehicle' \},\s*\{ \$match: \{ 'vehicle.model': mdl \} \},\s*\{ \$count: 'photo_count' \}\s*\]\);\s*c\.header\('Cache-Control', 'public, max-age=300'\)\s*return c\.json\(\{ data: \[\{ photo_count: count\.length \? count\[0\]\.photo_count : 0 \}\] \}\)/,
    `const agg = await db.aggregate('photos', [
      { $match: { status: 'approved' } },
      { $lookup: { from: 'vehicles', localField: 'license_plate', foreignField: '_id', as: 'vehicle' } },
      { $unwind: '$vehicle' },
      { $match: { 'vehicle.model': { $regex: mdl, $options: 'i' } } },
      { $group: {
          _id: null,
          total_photos: { $sum: 1 },
          total_views: { $sum: { $ifNull: ['$views', 0] } },
          unique_plates: { $addToSet: '$license_plate' },
          unique_routes: { $addToSet: '$route_no' },
          unique_ops: { $addToSet: '$operator' }
      }},
      { $project: {
          total_photos: 1,
          total_views: 1,
          total_vehicles: { $size: '$unique_plates' },
          total_ops: { $size: '$unique_ops' }
      }}
    ]);
    c.header('Cache-Control', 'public, max-age=300')
    const stats = agg.length ? agg[0] : { total_photos: 0, total_views: 0, total_vehicles: 0, total_ops: 0 };
    return c.json({ data: [stats] })`
);

fs.writeFileSync('temp/middle/src/routes/stats.ts', text, 'utf8');

