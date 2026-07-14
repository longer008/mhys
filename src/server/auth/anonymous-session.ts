import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getAnonymousSessionSecret } from "@/server/config/env";
import { signToken, verifyToken } from "@/server/auth/signed-token";

export const ANONYMOUS_SESSION_COOKIE = "meihua_user_session";
export const ANONYMOUS_SESSION_MAX_AGE = 365 * 24 * 60 * 60;

const anonymousSessionSchema = z.strictObject({
    version: z.literal(1),
    userId: z.uuid(),
    issuedAt: z.number().int().nonnegative(),
    expiresAt: z.number().int().positive(),
});

export interface AnonymousSession {
    userId: string;
    token: string;
    isNew: boolean;
}

export function resolveAnonymousSession(
    token: string | undefined,
    now = Date.now()
): AnonymousSession {
    const secret = getAnonymousSessionSecret();
    const payload = verifyToken(token, secret, anonymousSessionSchema);

    if (payload && payload.issuedAt <= now && payload.expiresAt > now) {
        return { userId: payload.userId, token: token!, isNew: false };
    }

    const userId = randomUUID();
    const newToken = signToken(
        {
            version: 1,
            userId,
            issuedAt: now,
            expiresAt: now + ANONYMOUS_SESSION_MAX_AGE * 1000,
        },
        secret
    );

    return { userId, token: newToken, isNew: true };
}
