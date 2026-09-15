
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET_FALLBACK = "vnbusarchive_secret_key_1234567890_change_me_in_production";

function getSecret(env) {
    return new TextEncoder().encode(env.JWT_SECRET || JWT_SECRET_FALLBACK);
}

export async function signToken(payload, env, expiresIn = "7d") {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(getSecret(env));
}

export async function verifyToken(token, env) {
    try {
        const { payload } = await jwtVerify(token, getSecret(env));
        return payload;
    } catch (e) {
        return null;
    }
}
