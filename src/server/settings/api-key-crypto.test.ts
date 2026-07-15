import { describe, expect, it } from "vitest";
import {
    decryptApiKey,
    encryptApiKey,
} from "@/server/settings/api-key-crypto";

const secret = "test-admin-session-secret-with-at-least-32-characters";

describe("后台 API Key 加密", () => {
    it("使用相同密钥可还原 API Key，存储内容不包含明文", () => {
        const apiKey = "sk-sensitive-test-key";
        const encrypted = encryptApiKey(apiKey, secret);

        expect(JSON.stringify(encrypted)).not.toContain(apiKey);
        expect(decryptApiKey(encrypted, secret)).toBe(apiKey);
    });

    it("拒绝错误密钥和被篡改的密文", () => {
        const encrypted = encryptApiKey("sk-sensitive-test-key", secret);

        expect(() => decryptApiKey(encrypted, `${secret}-wrong`)).toThrow(
            "API_KEY_DECRYPTION_FAILED"
        );
        expect(() =>
            decryptApiKey(
                { ...encrypted, ciphertext: `${encrypted.ciphertext}a` },
                secret
            )
        ).toThrow("API_KEY_DECRYPTION_FAILED");
    });
});
