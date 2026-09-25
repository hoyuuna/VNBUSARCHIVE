const fs = require('fs');
let code = fs.readFileSync('temp/middle/src/routes/photos.ts', 'utf8');

const target = `
  pipeline.push({ $match: preMatch });

  const needsLatePagination = !!(model || type || Object.keys(postMatch).length > 0 || sort === 'likes');

  let sortDoc: any = { created_at: -1 };
  const sortDir = (order.toLowerCase() === 'asc' ? 1 : -1);
  if (sort === 'taken_at') sortDoc = { taken_at: sortDir };
  else if (sort === 'views') sortDoc = { views: sortDir, created_at: -1 };
  else if (sort === 'likes') {
    sortDoc = { like_count: sortDir, views: -1, created_at: -1 };
  } else {
    sortDoc = { created_at: sortDir };
  }

  if (!needsLatePagination) {
    pipeline.push({ $sort: sortDoc });
    pipeline.push({ $skip: off });
    pipeline.push({ $limit: lim });
  }

  pipeline.push({
    $lookup: {
      from: 'vehicles',
      localField: 'license_plate',
      foreignField: '_id',
      as: 'vehicles'
    }
  });
  pipeline.push({ $unwind: { path: '$vehicles', preserveNullAndEmptyArrays: true } });

  if (model) {
    const stripEq = (val: any) => (typeof val === 'string' && val.startsWith('eq.')) ? val.substring(3) : val;
    pipeline.push({ $match: { 'vehicles.model': stripEq(model) } });
  }
  if (type) {
    const stripEq = (val: any) => (typeof val === 'string' && val.startsWith('eq.')) ? val.substring(3) : val;
    pipeline.push({ $match: { 'vehicles.type': stripEq(type) } });
  }

  let totalCount = null;
  if (count) {
    if (needsLatePagination) {
      const countPipeline = [...pipeline, { $match: postMatch }, { $count: 'total' }];
      const countRes = await db.aggregate('photos', countPipeline);
      totalCount = countRes.length > 0 ? countRes[0].total : 0;
    } else {
      totalCount = await db.countDocuments('photos', preMatch);
    }
  }

  pipeline.push({
    $lookup: {
      from: 'users',
      localField: 'uploader_id',
      foreignField: '_id',
      as: 'profiles'
    }
  });
  pipeline.push({ $unwind: { path: '$profiles', preserveNullAndEmptyArrays: true } });
  
  if (Object.keys(postMatch).length > 0) {
    pipeline.push({ $match: postMatch });
  }

  if (sort === 'likes') {
    pipeline.push({
      $lookup: {
        from: 'photo_likes',
        localField: '_id',
        foreignField: 'photo_id',
        as: 'likes'
      }
    });
    pipeline.push({ $addFields: { like_count: { $size: "$likes" } } });
  }

  if (needsLatePagination) {
    pipeline.push({ $sort: sortDoc });
    pipeline.push({ $skip: off });
    pipeline.push({ $limit: lim });
  }

  pipeline.push({
    $project: {
      likes: 0
    }
  });
`;

// Extract original content and replace the block
const startIdx = code.indexOf('pipeline.push({ $match: preMatch });');
const endMarker = 'const results = await db.aggregate(\'photos\', pipeline);';
const endIdx = code.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
    code = code.substring(0, startIdx) + target + '\n  ' + code.substring(endIdx);
    fs.writeFileSync('temp/middle/src/routes/photos.ts', code);
    console.log("Patched successfully");
} else {
    console.log("Could not find markers");
}
