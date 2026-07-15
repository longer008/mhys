import {
    createCipheriv,
    createDecipheriv,
    hkdfSync,
    randomBytes,
} from "node:crypto";
import { z } from "zod";
import { getAdminConfig } from "@/server/config/env";

const ENCRYPTION_CONTEXT = "meihua-admin-ai-provider-v1";
const base64UrlSchema = z
    .string()
    .min(1)
    .regex(/^[A-Za-z0-9_-]+$/, { error: "必须是规范的 Base64URL" });

export const encryptedApiKeySchema = z.strictObject({
    version: z.literal(1),
    iv: base64UrlSchema,
    authTag: base64UrlSchema,
    ciphertext: base64UrlSchema,
});

export type EncryptedApiKey = z.infer<typeof encryptedApiKeySchema>;

function deriveEncryptionKey(secret: string): Buffer {
    return Buffer.from(
        hkdfSync(
            "sha256",
            secret,
            "meihua-settings",
            ENCRYPTION_CONTEXT,
            32
        )
    );
}

function decodeBase64Url(value: string): Buffer {
    const decoded = Buffer.from(value, "base64url");
    if (decoded.toString("base64url") !== value) {
        throw new Error("API_KEY_DECRYPTION_FAILED");
    }
    return decoded;
}

export function encryptApiKey(
    apiKey: string,
    secret = getAdminConfig().sessionSecret
): EncryptedApiKey {
    const iv = randomBytes(12);
    const cipher = createCipheriv(
        "aes-256-gcm",
        deriveEncryptionKey(secret),
        iv
    );
    const ciphertext = Buffer.concat([
        cipher.update(apiKey, "utf8"),
        cipher.final(),
    ]);

    return {
        version: 1,
        iv: iv.toString("base64url"),
        authTag: cipher.getAuthTag().toString("base64url"),
        ciphertext: ciphertext.toString("base64url"),
    };
}

export function decryptApiKey(
    payload: unknown,
    secret = getAdminConfig().sessionSecret
): string {
    const parsed = encryptedApiKeySchema.safeParse(payload);
    if (!parsed.success) {
        throw new Error("API_KEY_DECRYPTION_FAILED");
    }

    try {
        const decipher = createDecipheriv(
            "aes-256-gcm",
            deriveEncryptionKey(secret),
            decodeBase64Url(parsed.data.iv)
        );
        decipher.setAuthTag(decodeBase64Url(parsed.data.authTag));
        return Buffer.concat([
            decipher.update(decodeBase64Url(parsed.data.ciphertext)),
            decipher.final(),
        ]).toString("utf8");
    } catch {
        throw new Error("API_KEY_DECRYPTION_FAILED");
    }
}
