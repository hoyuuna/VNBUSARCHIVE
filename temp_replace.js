const fs = require('fs');
let content = fs.readFileSync('src/js/00_core.js', 'utf8');

const target = 
        getSession: async () => {
            const token = app.api.getToken();
            if (!token) return { data: { session: null } };
            // Fetch current user from token
            try {
                const data = await app.api.get("/api/auth/me");
                return { data: { session: { access_token: token, user: data.user } } };
            } catch(e) {
                return { data: { session: null } };
            }
        },
.trim();

const replacement = 
        getSession: async () => {
            const token = app.api.getToken();
            console.log("VNBUS DEBUG: getToken() returned:", token ? token.substring(0, 15) + "..." : "null");
            if (!token) return { data: { session: null } };
            // Fetch current user from token
            try {
                const data = await app.api.get("/api/auth/me");
                console.log("VNBUS DEBUG: /api/auth/me response:", data);
                return { data: { session: { access_token: token, user: data.user } } };
            } catch(e) {
                console.error("VNBUS DEBUG: /api/auth/me threw error:", e);
                return { data: { session: null } };
            }
        },
.trim();

if(content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/js/00_core.js', content);
    console.log("Replaced successfully");
} else {
    console.log("Target not found");
}
