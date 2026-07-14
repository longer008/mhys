import { afterEach, describe, expect, it, vi } from "vitest";
import { getRequestIp } from "@/server/security/rate-limit";

afterEach(() => {
    vi.unstubAllEnvs();
});

describe("请求 IP 识别", () => {
    it("生产环境只信任 Vercel 注入的转发地址", () => {
        vi.stubEnv("NODE_ENV", "production");
        const request = new Request("https://example.com", {
            headers: {
                "x-vercel-forwarded-for": "203.0.113.10",
                "x-forwarded-for": "198.51.100.20",
                "x-real-ip": "192.0.2.30",
            },
        });

        expect(getRequestIp(request)).toBe("203.0.113.10");
    });

    it("生产环境忽略普通客户端转发头", () => {
        vi.stubEnv("NODE_ENV", "production");
        const request = new Request("https://example.com", {
            headers: { "x-forwarded-for": "198.51.100.20" },
        });

        expect(getRequestIp(request)).toBe("unknown");
    });
});
