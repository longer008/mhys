import { describe, expect, it } from "vitest";
import { resolveSafeOutboundBaseUrl } from "@/server/security/outbound-url";

describe("自定义 API 地址安全校验", () => {
    it("拒绝本机、内网和带凭据的地址", async () => {
        await expect(resolveSafeOutboundBaseUrl("https://localhost/v1")).rejects.toMatchObject({
            code: "UNSAFE_API_URL",
        });
        await expect(resolveSafeOutboundBaseUrl("https://127.0.0.1/v1")).rejects.toMatchObject({
            code: "UNSAFE_API_URL",
        });
        await expect(resolveSafeOutboundBaseUrl("https://user:pass@example.com/v1")).rejects.toMatchObject({
            code: "UNSAFE_API_URL",
        });
    });
});
