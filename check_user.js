const fs = require('fs');
let text = fs.readFileSync('temp/middle/src/routes/stats.ts', 'utf8');

const injection = `
stats.get('/test-user', async (c) => {
  const doId = c.env.MONGO_DO.idFromName('global');
  const db = c.env.MONGO_DO.get(doId) as any;
  const user = await db.findOne('users', { email: 'nghoanganhtuann@gmail.com' });
  return c.json(user || { error: 'Not found' });
})
`;

text = text.replace('export default stats', injection + '\nexport default stats');
fs.writeFileSync('temp/middle/src/routes/stats.ts', text, 'utf8');
