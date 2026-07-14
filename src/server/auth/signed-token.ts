import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

function createSignature(payload: string, secret: string): Buffer {
    return createHmac("sha256", secret).update(payload).digest();
}

export function signToken(payload: object, secret: string): string {
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = createSignature(encodedPayload, secret).toString("base64url");
    return `${encodedPayload}.${signature}`;
}

export function verifyToken<T>(
    token: string | undefined,
    secret: string,
    schema: z.ZodType<T>
): T | null {
    if (!token) return null;

    const [encodedPayload, encodedSignature, extra] = token.split(".");
    if (!encodedPayload || !encodedSignature || extra) return null;

    try {
        const providedSignature = Buffer.from(encodedSignature, "base64url");
        const expectedSignature = createSignature(encodedPayload, secret);
        if (
            providedSignature.length !== expectedSignature.length ||
            !timingSafeEqual(providedSignature, expectedSignature)
        ) {
            return null;
        }

        const payload = JSON.parse(
            Buffer.from(encodedPayload, "base64url").toString("utf8")
        );
        const result = schema.safeParse(payload);
        return result.success ? result.data : null;
    } catch {
        return null;
    }
}
