const fs = require('fs');
let text = fs.readFileSync('temp/middle/src/routes/stats.ts', 'utf8');

const injection = `
stats.get('/test-me', async (c) => {
  const doId = c.env.MONGO_DO.idFromName('global');
  const db = c.env.MONGO_DO.get(doId) as any;
  const user = await db.findOne('users', { email: 'nghoanganhtuann@gmail.com' });
  if (!user) return c.json({error: 'not found'});
  
  // Return exactly what /me returns
  return c.json({ user: { id: user._id, email: user.email, role: user.role, username: user.username, avatar_url: user.avatar_url, ban_status: user.ban_status, preferences: user.preferences, subroles: user.subroles, email_confirmed_at: user.email_confirmed_at } })
})
`;

text = text.replace('export default stats', injection + '\nexport default stats');
fs.writeFileSync('temp/middle/src/routes/stats.ts', text, 'utf8');
