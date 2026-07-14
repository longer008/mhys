import { describe, expect, it } from "vitest";
import { z } from "zod";
import { signToken, verifyToken } from "@/server/auth/signed-token";

const secret = "test-secret-with-at-least-thirty-two-characters";
const schema = z.strictObject({
    userId: z.uuid(),
    expiresAt: z.number().int().positive(),
});

describe("签名令牌", () => {
    const payload = {
        userId: "7d54143c-1f39-4dfd-9a92-e0d8864d99bc",
        expiresAt: 2_000_000_000_000,
    };

    it("可验证由相同密钥签发且结构合法的令牌", () => {
        const token = signToken(payload, secret);
        expect(verifyToken(token, secret, schema)).toEqual(payload);
    });

    it("拒绝被篡改或使用错误密钥的令牌", () => {
        const token = signToken(payload, secret);
        const tampered = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;

        expect(verifyToken(tampered, secret, schema)).toBeNull();
        expect(verifyToken(token, `${secret}-wrong`, schema)).toBeNull();
    });

    it("拒绝不符合声明结构的令牌", () => {
        const token = signToken({ userId: "invalid", expiresAt: -1 }, secret);
        expect(verifyToken(token, secret, schema)).toBeNull();
    });
});
