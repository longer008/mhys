import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    getAdminSettingsSnapshot,
    getPublicSiteSettings,
    resolveAiConfigDraft,
} from "@/server/settings/runtime-settings";

describe("运行时设置", () => {
    beforeEach(() => {
        vi.stubEnv("DATABASE_URL", "");
        vi.stubEnv("OPENAI_API_KEY", "sk-current-secret");
        vi.stubEnv("OPENAI_BASE_URL", "https://api.example.com/v1");
        vi.stubEnv("OPENAI_MODEL", "current-model");
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("API 地址未变化时允许复用已有密钥", async () => {
        const config = await resolveAiConfigDraft({
            baseUrl: "https://api.example.com/v1/",
            model: "next-model",
        });

        expect(config).toEqual({
            baseUrl: "https://api.example.com/v1",
            model: "next-model",
            apiKey: "sk-current-secret",
        });
    });

    it("API 地址变化且未提交新密钥时拒绝复用", async () => {
        await expect(
            resolveAiConfigDraft({
                baseUrl: "https://other.example.com/v1",
                model: "next-model",
            })
        ).rejects.toMatchObject({
            status: 400,
            code: "AI_KEY_REQUIRED",
        });
    });

    it("API 地址变化但提交新密钥时允许使用", async () => {
        const config = await resolveAiConfigDraft({
            baseUrl: "https://other.example.com/v1/",
            model: "next-model",
            apiKey: "sk-new-secret",
        });

        expect(config).toEqual({
            baseUrl: "https://other.example.com/v1",
            model: "next-model",
            apiKey: "sk-new-secret",
        });
    });

    it("公共设置不受无效限流环境变量影响", async () => {
        vi.stubEnv("AI_USER_LIMIT_PER_10_MINUTES", "invalid");
        vi.stubEnv("SITE_TITLE", "测试站点");

        const settings = await getPublicSiteSettings();

        expect(settings.site.siteTitle).toBe("测试站点");
        expect(settings.divination.enabledMethods).toEqual([
            "manual",
            "random",
            "time",
        ]);
    });

    it("未保存后台 API 配置时不回填环境变量中的地址和模型", async () => {
        const settings = await getAdminSettingsSnapshot();

        expect(settings.aiProvider).toEqual({
            baseUrl: "",
            model: "",
            source: "environment",
            apiKeyStatus: "configured",
        });
    });
});
