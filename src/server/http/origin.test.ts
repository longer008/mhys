import { afterEach, describe, expect, it, vi } from "vitest";
import { assertSameOrigin } from "@/server/http/origin";

function createRequest(origin: string): Request {
    return new Request("http://localhost:3000/api/admin/auth", {
        method: "POST",
        headers: { origin },
    });
}

describe("写请求同源校验", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("开发环境允许等价的本机回环地址", () => {
        expect(() =>
            assertSameOrigin(createRequest("http://127.0.0.1:3000"))
        ).not.toThrow();
    });

    it("开发环境仍拒绝非本机来源和端口变化", () => {
        expect(() =>
            assertSameOrigin(createRequest("https://example.com"))
        ).toThrowError(expect.objectContaining({ code: "INVALID_ORIGIN" }));
        expect(() =>
            assertSameOrigin(createRequest("http://127.0.0.1:3001"))
        ).toThrowError(expect.objectContaining({ code: "INVALID_ORIGIN" }));
    });

    it("生产环境不允许回环地址别名绕过精确同源校验", () => {
        vi.stubEnv("NODE_ENV", "production");

        expect(() =>
            assertSameOrigin(createRequest("http://127.0.0.1:3000"))
        ).toThrowError(expect.objectContaining({ code: "INVALID_ORIGIN" }));
    });
});
