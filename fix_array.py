import re

with open('temp/api-middleware/src/index.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix verifyRes in /api/auth/verify
text = re.sub(
    r"let user = verifyRes\.ok \? await verifyRes\.json\(\) : null;",
    r"let userData = verifyRes.ok ? await verifyRes.json() : null;\n    let user = Array.isArray(userData) ? userData[0] : userData;",
    text
)

# Fix verifyRes in /auth/v1/user for PUT
text = re.sub(
    r"const validUser = verifyRes\.ok \? await verifyRes\.json\(\) : null;",
    r"const validUserData = verifyRes.ok ? await verifyRes.json() : null;\n        const validUser = Array.isArray(validUserData) ? validUserData[0] : validUserData;",
    text
)

# Fix sign up token generation
text = re.sub(
    r"const user = insertRes\.rows\[0\];",
    r"let user = Array.isArray(insertRes) ? insertRes[0] : (insertRes.rows ? insertRes.rows[0] : insertRes);",
    text
)

with open('temp/api-middleware/src/index.js', 'w', encoding='utf-8') as f:
    f.write(text)

print("Fixed user array unwrapping!")
