const fs = require('fs');

let text = fs.readFileSync('src/js/01_router.js', 'utf8');
if (!text.includes('searchParams.get("token")')) {
    text = text.replace(
        /let session = null;/,
        `// Check for token from OAuth
            const queryParams = new URLSearchParams(window.location.search);
            const oauthToken = queryParams.get('token');
            if (oauthToken) {
                // Parse JWT payload for user info
                try {
                    const payload = JSON.parse(atob(oauthToken.split('.')[1]));
                    const sess = { token: oauthToken, user: { id: payload.id, email: payload.email, role: payload.role } };
                    sessionStorage.setItem("VNBA_SESS_AUTH", JSON.stringify(sess));
                    // Clean URL
                    window.history.replaceState(null, null, window.location.pathname);
                } catch(e) { console.error('OAuth token parse error:', e); }
            }
            
            // Check for oauth_error
            const oauthError = queryParams.get('oauth_error');
            if (oauthError) {
                setTimeout(() => {
                    if (oauthError === 'not_registered') {
                        app.ui.showAlert("Tài kho?n chua du?c dang ký. Vui lòng t?o tài kho?n m?i.", () => app.auth.check('register'));
                    } else if (oauthError === 'no_email_provided') {
                        app.ui.showAlert("Không l?y du?c email t? nhà cung c?p. Vui lòng th? l?i.");
                    } else {
                        app.ui.showAlert("Ðang nh?p th?t b?i. Vui lòng th? l?i.");
                    }
                    window.history.replaceState(null, null, window.location.pathname);
                }, 500);
            }
            let session = null;`
    );
    fs.writeFileSync('src/js/01_router.js', text, 'utf8');
}
