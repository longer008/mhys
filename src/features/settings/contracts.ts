import { z } from "zod";
import type { DivinationMethod } from "@/features/divination/types";

export const settingsSectionSchema = z.enum([
    "site",
    "divination",
    "interpretation",
    "limits",
    "aiProvider",
]);

export type SettingsSection = z.infer<typeof settingsSectionSchema>;

const trimmedText = (minimum: number, maximum: number, label: string) =>
    z.string().trim().min(minimum, { error: `${label}不能为空` }).max(maximum, {
        error: `${label}不能超过 ${maximum} 个字符`,
    });

export const divinationMethodSchema = z.enum(["manual", "random", "time"]);

export const siteContentSettingsSchema = z
    .strictObject({
        siteTitle: trimmedText(1, 40, "站点名称"),
        homeEyebrow: trimmedText(1, 40, "首页眉题"),
        homeSubtitle: trimmedText(1, 180, "首页引导语"),
        divinationNotice: trimmedText(1, 100, "问卦须知"),
        announcementEnabled: z.boolean(),
        announcementText: z.string().trim().max(240, {
            error: "公告内容不能超过 240 个字符",
        }),
        footerText: trimmedText(1, 80, "页脚文字"),
        disclaimerText: trimmedText(1, 300, "免责声明"),
    })
    .superRefine((value, context) => {
        if (value.announcementEnabled && !value.announcementText) {
            context.addIssue({
                code: "custom",
                path: ["announcementText"],
                message: "启用公告后必须填写公告内容",
            });
        }
    });

export type SiteContentSettings = z.infer<typeof siteContentSettingsSchema>;

export const divinationRulesSettingsSchema = z
    .strictObject({
        enabledMethods: z
            .array(divinationMethodSchema)
            .min(1, { error: "至少启用一种起卦方式" })
            .max(3)
            .refine((methods) => new Set(methods).size === methods.length, {
                error: "起卦方式不能重复",
            }),
        defaultMethod: divinationMethodSchema,
        aiInterpretationEnabled: z.boolean(),
        allowCustomAi: z.boolean(),
        maxQuestionLength: z.number().int().min(50).max(500),
    })
    .superRefine((value, context) => {
        if (!value.enabledMethods.includes(value.defaultMethod)) {
            context.addIssue({
                code: "custom",
                path: ["defaultMethod"],
                message: "默认起卦方式必须处于启用状态",
            });
        }
    });

export type DivinationRulesSettings = z.infer<
    typeof divinationRulesSettingsSchema
>;

export const interpretationPreferencesSchema = z.strictObject({
    detailLevel: z.enum(["concise", "standard", "detailed"]),
    tone: z.enum(["plain", "classical"]),
});

export type InterpretationPreferences = z.infer<
    typeof interpretationPreferencesSchema
>;

export const usageLimitSettingsSchema = z.strictObject({
    userPerTenMinutes: z.number().int().min(1).max(100),
    userDaily: z.number().int().min(1).max(1_000),
    ipPerTenMinutes: z.number().int().min(1).max(1_000),
    globalDaily: z.number().int().min(1).max(100_000),
    limitMessage: trimmedText(1, 120, "额度提示"),
});

export type UsageLimitSettings = z.infer<typeof usageLimitSettingsSchema>;

const aiBaseUrlSchema = z
    .string()
    .trim()
    .url({ error: "API 地址格式无效" })
    .max(2048)
    .refine((value) => new URL(value).protocol === "https:", {
        error: "API 地址必须使用 HTTPS",
    });

export const aiProviderEditorSchema = z.strictObject({
    baseUrl: aiBaseUrlSchema,
    model: trimmedText(1, 128, "模型名称"),
    apiKey: z
        .string()
        .trim()
        .min(1, { error: "API Key 不能为空" })
        .max(512)
        .optional(),
});

export type AiProviderEditor = z.infer<typeof aiProviderEditorSchema>;

export const settingsSectionUpdateSchema = z.discriminatedUnion("section", [
    z.strictObject({
        section: z.literal("site"),
        value: siteContentSettingsSchema,
    }),
    z.strictObject({
        section: z.literal("divination"),
        value: divinationRulesSettingsSchema,
    }),
    z.strictObject({
        section: z.literal("interpretation"),
        value: interpretationPreferencesSchema,
    }),
    z.strictObject({
        section: z.literal("limits"),
        value: usageLimitSettingsSchema,
    }),
    z.strictObject({
        section: z.literal("aiProvider"),
        value: aiProviderEditorSchema,
    }),
]);

export type SettingsSectionUpdate = z.infer<
    typeof settingsSectionUpdateSchema
>;

export const settingsSectionResetSchema = z.strictObject({
    section: settingsSectionSchema,
});

export const aiConnectionTestSchema = aiProviderEditorSchema;

export const DEFAULT_SITE_CONTENT_SETTINGS: SiteContentSettings = {
    siteTitle: "梅花易数",
    homeEyebrow: "观物取象 · 以数明理",
    homeSubtitle: "万物皆有数，数中自有应。静心写下所问之事，以三数观其始终变化。",
    divinationNotice: "无事不占 · 不动不占 · 诚心静气",
    announcementEnabled: false,
    announcementText: "",
    footerText: "观象授时 · 万物皆数",
    disclaimerText: "本工具仅供传统文化学习与娱乐，不替代医疗、法律、投资或人身安全方面的专业意见。",
};

export const DEFAULT_DIVINATION_RULES_SETTINGS: DivinationRulesSettings = {
    enabledMethods: ["manual", "random", "time"],
    defaultMethod: "manual",
    aiInterpretationEnabled: true,
    allowCustomAi: true,
    maxQuestionLength: 500,
};

export const DEFAULT_INTERPRETATION_PREFERENCES: InterpretationPreferences = {
    detailLevel: "detailed",
    tone: "classical",
};

export const DEFAULT_USAGE_LIMIT_SETTINGS: UsageLimitSettings = {
    userPerTenMinutes: 5,
    userDaily: 20,
    ipPerTenMinutes: 20,
    globalDaily: 500,
    limitMessage: "今日解卦次数已达上限，请稍后再试",
};

export interface PublicSiteSettings {
    site: SiteContentSettings;
    divination: DivinationRulesSettings;
}

export interface AdminAiProviderSnapshot {
    baseUrl: string;
    model: string;
    source: "database" | "environment";
    apiKeyStatus: "configured" | "missing" | "invalid";
}

export interface AdminSettingsSnapshot {
    site: SiteContentSettings;
    divination: DivinationRulesSettings;
    interpretation: InterpretationPreferences;
    limits: UsageLimitSettings;
    aiProvider: AdminAiProviderSnapshot;
    updatedAt: Partial<Record<SettingsSection, string>>;
}

export const METHOD_LABELS: Record<DivinationMethod, string> = {
    manual: "一念取数",
    random: "随数成卦",
    time: "依时成卦",
};
