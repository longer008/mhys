import { describe, expect, it } from "vitest";
import {
    DEFAULT_DIVINATION_RULES_SETTINGS,
    DEFAULT_SITE_CONTENT_SETTINGS,
    divinationRulesSettingsSchema,
    siteContentSettingsSchema,
    usageLimitSettingsSchema,
} from "@/features/settings/contracts";

describe("后台设置契约", () => {
    it("接受完整且互相一致的默认设置", () => {
        expect(
            siteContentSettingsSchema.safeParse(DEFAULT_SITE_CONTENT_SETTINGS)
                .success
        ).toBe(true);
        expect(
            divinationRulesSettingsSchema.safeParse(
                DEFAULT_DIVINATION_RULES_SETTINGS
            ).success
        ).toBe(true);
    });

    it("拒绝关闭所有起卦方式或使用已停用的默认方式", () => {
        expect(
            divinationRulesSettingsSchema.safeParse({
                ...DEFAULT_DIVINATION_RULES_SETTINGS,
                enabledMethods: [],
            }).success
        ).toBe(false);
        expect(
            divinationRulesSettingsSchema.safeParse({
                ...DEFAULT_DIVINATION_RULES_SETTINGS,
                enabledMethods: ["time"],
                defaultMethod: "manual",
            }).success
        ).toBe(false);
    });

    it("启用公告后必须填写公告内容", () => {
        expect(
            siteContentSettingsSchema.safeParse({
                ...DEFAULT_SITE_CONTENT_SETTINGS,
                announcementEnabled: true,
                announcementText: "",
            }).success
        ).toBe(false);
    });

    it("拒绝超出安全范围的使用额度", () => {
        expect(
            usageLimitSettingsSchema.safeParse({
                userPerTenMinutes: 0,
                userDaily: 20,
                ipPerTenMinutes: 20,
                globalDaily: 500,
                limitMessage: "请稍后再试",
            }).success
        ).toBe(false);
    });

});
