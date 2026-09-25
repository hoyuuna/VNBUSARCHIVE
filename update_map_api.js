const fs = require('fs');
let code = fs.readFileSync('temp/middle/src/routes/map.ts', 'utf8');

const s = String.fromCharCode(36);
const newRoutes = `
// Admin: Update zone
map.put('/zones/:id', authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param('id')
  const { name, bounds, description } = await c.req.json()
  const dbId = c.env.MONGO_DO.idFromName('global');
  const db = c.env.MONGO_DO.get(dbId) as any;

  await db.updateOne('no_photo_zones', { _id: id }, {
    [ \`\${s}set\` ]: { name, bounds, description }
  });
  
  return c.json({ message: 'Zone updated' })
})

// Admin: Delete zone
map.delete('/zones/:id', authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param('id')
  const dbId = c.env.MONGO_DO.idFromName('global');
  const db = c.env.MONGO_DO.get(dbId) as any;

  await db.deleteOne('no_photo_zones', { _id: id });
  
  return c.json({ message: 'Zone deleted' })
})

export default map
`;

code = code.replace(/export default map/g, newRoutes);
fs.writeFileSync('temp/middle/src/routes/map.ts', code);
console.log('Updated map.ts');
