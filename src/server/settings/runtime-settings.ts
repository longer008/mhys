import { z } from "zod";
import {
    DEFAULT_DIVINATION_RULES_SETTINGS,
    DEFAULT_INTERPRETATION_PREFERENCES,
    DEFAULT_SITE_CONTENT_SETTINGS,
    DEFAULT_USAGE_LIMIT_SETTINGS,
    aiProviderEditorSchema,
    divinationRulesSettingsSchema,
    interpretationPreferencesSchema,
    siteContentSettingsSchema,
    usageLimitSettingsSchema,
    type AdminSettingsSnapshot,
    type AiProviderEditor,
    type DivinationRulesSettings,
    type InterpretationPreferences,
    type PublicSiteSettings,
    type SettingsSection,
    type SettingsSectionUpdate,
    type SiteContentSettings,
    type UsageLimitSettings,
} from "@/features/settings/contracts";
import {
    getAiConfig,
    getRateLimitConfig,
    getSiteTitle,
    type AiConfig,
} from "@/server/config/env";
import { isDatabaseConfigured } from "@/server/db/client";
import {
    deleteStoredSetting,
    getStoredSettings,
    setStoredSetting,
    type StoredSettingEntry,
} from "@/server/db/settings-repository";
import { ApiError } from "@/server/http/api-error";
import { logWarn } from "@/server/observability/logger";
import { resolveSafeOutboundBaseUrl } from "@/server/security/outbound-url";
import {
    decryptApiKey,
    encryptedApiKeySchema,
    encryptApiKey,
} from "@/server/settings/api-key-crypto";

const SETTING_KEYS = {
    site: "site_content_v1",
    divination: "divination_rules_v1",
    interpretation: "interpretation_preferences_v1",
    limits: "usage_limits_v1",
    aiProvider: "ai_provider_v1",
} as const satisfies Record<SettingsSection, string>;

const ALL_SETTING_KEYS = Object.values(SETTING_KEYS);
const PUBLIC_SETTING_KEYS = [SETTING_KEYS.site, SETTING_KEYS.divination];

const storedAiProviderSchema = z.strictObject({
    version: z.literal(1),
    baseUrl: aiProviderEditorSchema.shape.baseUrl,
    model: aiProviderEditorSchema.shape.model,
    apiKey: encryptedApiKeySchema,
});

interface RuntimeSettings {
    site: SiteContentSettings;
    divination: DivinationRulesSettings;
    interpretation: InterpretationPreferences;
    limits: UsageLimitSettings;
}

export interface ResolvedAiConfig {
    config: AiConfig;
    source: "database" | "environment";
}

function getDefaultSite(): SiteContentSettings {
    return {
        ...DEFAULT_SITE_CONTENT_SETTINGS,
        siteTitle: getSiteTitle(),
    };
}

function getDefaultDivination(): DivinationRulesSettings {
    return { ...DEFAULT_DIVINATION_RULES_SETTINGS };
}

function getDefaultInterpretation(): InterpretationPreferences {
    return { ...DEFAULT_INTERPRETATION_PREFERENCES };
}

function getDefaultLimits(): UsageLimitSettings {
    const rateLimits = getRateLimitConfig();
    return {
        ...DEFAULT_USAGE_LIMIT_SETTINGS,
        userPerTenMinutes: rateLimits.userPerTenMinutes,
        userDaily: rateLimits.userDaily,
        ipPerTenMinutes: rateLimits.ipPerTenMinutes,
        globalDaily: rateLimits.globalDaily,
    };
}

function parseStoredValue<T>(options: {
    entry: StoredSettingEntry | undefined;
    schema: z.ZodType<T>;
    getFallback: () => T;
    section: SettingsSection;
}): T {
    if (!options.entry) return options.getFallback();

    const parsed = options.schema.safeParse(options.entry.value);
    if (parsed.success) return parsed.data;

    logWarn("stored_setting_invalid", {
        section: options.section,
        issueCount: parsed.error.issues.length,
    });
    return options.getFallback();
}

async function loadEntries(
    keys: readonly string[] = ALL_SETTING_KEYS
): Promise<Map<string, StoredSettingEntry>> {
    if (!isDatabaseConfigured()) return new Map();
    return getStoredSettings(keys);
}

async function loadPublicEntries(): Promise<Map<string, StoredSettingEntry>> {
    try {
        return await loadEntries(PUBLIC_SETTING_KEYS);
    } catch (error) {
        logWarn("public_settings_fallback", {
            errorName: error instanceof Error ? error.name : "UnknownError",
        });
        return new Map();
    }
}

function resolveRuntimeSettings(
    entries: Map<string, StoredSettingEntry>
): RuntimeSettings {
    return {
        site: parseStoredValue({
            entry: entries.get(SETTING_KEYS.site),
            schema: siteContentSettingsSchema,
            getFallback: getDefaultSite,
            section: "site",
        }),
        divination: parseStoredValue({
            entry: entries.get(SETTING_KEYS.divination),
            schema: divinationRulesSettingsSchema,
            getFallback: getDefaultDivination,
            section: "divination",
        }),
        interpretation: parseStoredValue({
            entry: entries.get(SETTING_KEYS.interpretation),
            schema: interpretationPreferencesSchema,
            getFallback: getDefaultInterpretation,
            section: "interpretation",
        }),
        limits: parseStoredValue({
            entry: entries.get(SETTING_KEYS.limits),
            schema: usageLimitSettingsSchema,
            getFallback: getDefaultLimits,
            section: "limits",
        }),
    };
}

function resolvePublicSettings(
    entries: Map<string, StoredSettingEntry>
): PublicSiteSettings {
    return {
        site: parseStoredValue({
            entry: entries.get(SETTING_KEYS.site),
            schema: siteContentSettingsSchema,
            getFallback: getDefaultSite,
            section: "site",
        }),
        divination: parseStoredValue({
            entry: entries.get(SETTING_KEYS.divination),
            schema: divinationRulesSettingsSchema,
            getFallback: getDefaultDivination,
            section: "divination",
        }),
    };
}

function tryGetEnvironmentAiConfig(): AiConfig | null {
    try {
        return getAiConfig();
    } catch (error) {
        logWarn("environment_ai_config_invalid", {
            errorName: error instanceof Error ? error.name : "UnknownError",
        });
        return null;
    }
}

function normalizeAiBaseUrl(baseUrl: string): string {
    const url = new URL(baseUrl);
    url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString().replace(/\/$/, "");
}

function resolveStoredAiConfig(entry: StoredSettingEntry): AiConfig {
    const parsed = storedAiProviderSchema.safeParse(entry.value);
    if (!parsed.success) {
        throw new ApiError(
            503,
            "AI_CONFIG_INVALID",
            "后台 AI 配置无效，请重新保存"
        );
    }

    let apiKey: string;
    try {
        apiKey = decryptApiKey(parsed.data.apiKey);
    } catch {
        throw new ApiError(
            503,
            "AI_KEY_UNAVAILABLE",
            "后台 API Key 无法解密，请重新保存"
        );
    }

    return {
        baseUrl: parsed.data.baseUrl.replace(/\/+$/, ""),
        model: parsed.data.model,
        apiKey,
    };
}

export async function getRuntimeSettings(): Promise<RuntimeSettings> {
    return resolveRuntimeSettings(await loadEntries());
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
    return resolvePublicSettings(await loadPublicEntries());
}

export async function getEffectiveAiConfig(): Promise<ResolvedAiConfig> {
    const entries = await loadEntries([SETTING_KEYS.aiProvider]);
    const stored = entries.get(SETTING_KEYS.aiProvider);
    if (stored) {
        return {
            config: resolveStoredAiConfig(stored),
            source: "database",
        };
    }

    const environment = tryGetEnvironmentAiConfig();
    if (!environment) {
        throw new ApiError(503, "AI_UNAVAILABLE", "AI 服务尚未配置");
    }
    return { config: environment, source: "environment" };
}

export async function resolveAiConfigDraft(
    draft: AiProviderEditor
): Promise<AiConfig> {
    const baseUrl = normalizeAiBaseUrl(draft.baseUrl);
    if (draft.apiKey) {
        return {
            baseUrl,
            model: draft.model,
            apiKey: draft.apiKey,
        };
    }

    const currentConfig = (await getEffectiveAiConfig()).config;
    if (normalizeAiBaseUrl(currentConfig.baseUrl) !== baseUrl) {
        throw new ApiError(
            400,
            "AI_KEY_REQUIRED",
            "更换 API 地址时必须填写新的 API Key"
        );
    }

    return {
        baseUrl,
        model: draft.model,
        apiKey: currentConfig.apiKey,
    };
}

function getUpdatedAt(
    entries: Map<string, StoredSettingEntry>
): AdminSettingsSnapshot["updatedAt"] {
    const result: AdminSettingsSnapshot["updatedAt"] = {};
    for (const section of Object.keys(SETTING_KEYS) as SettingsSection[]) {
        const entry = entries.get(SETTING_KEYS[section]);
        if (entry) result[section] = entry.updatedAt.toISOString();
    }
    return result;
}

export async function getAdminSettingsSnapshot(): Promise<AdminSettingsSnapshot> {
    const entries = await loadEntries();
    const settings = resolveRuntimeSettings(entries);
    const storedAi = entries.get(SETTING_KEYS.aiProvider);

    let aiProvider: AdminSettingsSnapshot["aiProvider"];
    if (storedAi) {
        const parsed = storedAiProviderSchema.safeParse(storedAi.value);
        let apiKeyStatus: AdminSettingsSnapshot["aiProvider"]["apiKeyStatus"] =
            "invalid";

        if (parsed.success) {
            try {
                decryptApiKey(parsed.data.apiKey);
                apiKeyStatus = "configured";
            } catch {
                apiKeyStatus = "invalid";
            }
        }

        aiProvider = {
            baseUrl: parsed.success ? parsed.data.baseUrl : "",
            model: parsed.success ? parsed.data.model : "",
            source: "database",
            apiKeyStatus,
        };
    } else {
        const environment = tryGetEnvironmentAiConfig();
        aiProvider = {
            baseUrl: "",
            model: "",
            source: "environment",
            apiKeyStatus: environment ? "configured" : "missing",
        };
    }

    return {
        ...settings,
        aiProvider,
        updatedAt: getUpdatedAt(entries),
    };
}

export async function updateSettingsSection(
    update: SettingsSectionUpdate
): Promise<void> {
    if (update.section === "aiProvider") {
        const config = await resolveAiConfigDraft(update.value);
        await resolveSafeOutboundBaseUrl(config.baseUrl);
        await setStoredSetting(SETTING_KEYS.aiProvider, {
            version: 1,
            baseUrl: config.baseUrl,
            model: config.model,
            apiKey: encryptApiKey(config.apiKey),
        });
        return;
    }

    await setStoredSetting(SETTING_KEYS[update.section], update.value);
}

export async function resetSettingsSection(
    section: SettingsSection
): Promise<void> {
    await deleteStoredSetting(SETTING_KEYS[section]);
}
