import {
    createHash,
    randomBytes,
    timingSafeEqual,
} from "node:crypto";
import { z } from "zod";
import { getAdminConfig } from "@/server/config/env";
import { signToken, verifyToken } from "@/server/auth/signed-token";

export const ADMIN_SESSION_COOKIE = "meihua_admin_session";
export const ADMIN_SESSION_MAX_AGE = 24 * 60 * 60;

const adminSessionSchema = z.strictObject({
    version: z.literal(1),
    issuedAt: z.number().int().nonnegative(),
    expiresAt: z.number().int().positive(),
    nonce: z.string().min(32),
});

export function verifyAdminPassword(password: string): boolean {
    const config = getAdminConfig();
    const provided = createHash("sha256").update(password).digest();
    const expected = createHash("sha256").update(config.password).digest();
    return timingSafeEqual(provided, expected);
}

export function createAdminSessionToken(now = Date.now()): string {
    const config = getAdminConfig();
    return signToken(
        {
            version: 1,
            issuedAt: now,
            expiresAt: now + ADMIN_SESSION_MAX_AGE * 1000,
            nonce: randomBytes(24).toString("base64url"),
        },
        config.sessionSecret
    );
}

export function verifyAdminSessionToken(
    token: string | undefined,
    now = Date.now()
): boolean {
    const config = getAdminConfig();
    const payload = verifyToken(token, config.sessionSecret, adminSessionSchema);
    return Boolean(
        payload &&
        payload.issuedAt <= now &&
        payload.expiresAt > now
    );
}
