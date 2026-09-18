const fs = require('fs');
let text = fs.readFileSync('temp/middle/src/middlewares/auth.ts', 'utf8');

const oldStr = `    if (userProfile.ban_status === 'banned' || (typeof userProfile.ban_status === 'string' && userProfile.ban_status.includes('reason'))) {
      return c.json({ error: 'Forbidden: Account has been banned' }, 403)
    }`;

const newStr = `    let isBanned = false;
    if (userProfile.ban_status === 'banned') {
      isBanned = true;
    } else if (typeof userProfile.ban_status === 'string') {
      try {
        const banInfo = JSON.parse(userProfile.ban_status);
        if (banInfo && banInfo.banned === true) isBanned = true;
      } catch(e) {}
    } else if (typeof userProfile.ban_status === 'object' && userProfile.ban_status !== null) {
      if (userProfile.ban_status.banned === true) isBanned = true;
    }

    if (isBanned) {
      return c.json({ error: 'Forbidden: Account has been banned' }, 403)
    }`;

text = text.replace(oldStr, newStr);

fs.writeFileSync('temp/middle/src/middlewares/auth.ts', text, 'utf8');
