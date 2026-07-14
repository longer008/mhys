import { z } from "zod";

const httpsUrlSchema = z
    .string()
    .trim()
    .url({ error: "必须是合法 URL" })
    .refine((value) => new URL(value).protocol === "https:", {
        error: "必须使用 HTTPS",
    });

const positiveIntegerFromEnv = (defaultValue: number) =>
    z.coerce.number().int().positive().default(defaultValue);

function formatIssues(error: z.ZodError): string {
    return error.issues
        .map((issue) => `${issue.path.join(".") || "配置"}: ${issue.message}`)
        .join("；");
}

function parseConfig<T>(
    schema: z.ZodType<T>,
    value: unknown,
    capabilityName: string
): T {
    const result = schema.safeParse(value);
    if (!result.success) {
        throw new Error(`${capabilityName}配置无效：${formatIssues(result.error)}`);
    }
    return result.data;
}

const databaseUrlSchema = z
    .string()
    .trim()
    .url({ error: "必须是合法 PostgreSQL URL" })
    .refine((value) => {
        const protocol = new URL(value).protocol;
        return protocol === "postgres:" || protocol === "postgresql:";
    }, { error: "必须使用 postgres 或 postgresql 协议" });

const databaseConfigSchema = z.strictObject({
    DATABASE_URL: databaseUrlSchema,
});

export interface DatabaseConfig {
    connectionString: string;
}

export function isDatabaseConfigured(): boolean {
    return Boolean(process.env.DATABASE_URL?.trim());
}

export function getDatabaseConfig(): DatabaseConfig | null {
    if (!isDatabaseConfigured()) return null;

    const config = parseConfig(
        databaseConfigSchema,
        { DATABASE_URL: process.env.DATABASE_URL },
        "数据库"
    );

    return { connectionString: config.DATABASE_URL };
}

const aiConfigSchema = z.strictObject({
    OPENAI_API_KEY: z.string().trim().min(1, { error: "不能为空" }),
    OPENAI_BASE_URL: httpsUrlSchema,
    OPENAI_MODEL: z.string().trim().min(1, { error: "不能为空" }).max(128),
});

export interface AiConfig {
    apiKey: string;
    baseUrl: string;
    model: string;
}

export function getAiConfig(): AiConfig {
    const config = parseConfig(
        aiConfigSchema,
        {
            OPENAI_API_KEY: process.env.OPENAI_API_KEY,
            OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
            OPENAI_MODEL: process.env.OPENAI_MODEL,
        },
        "AI 服务"
    );

    return {
        apiKey: config.OPENAI_API_KEY,
        baseUrl: config.OPENAI_BASE_URL.replace(/\/+$/, ""),
        model: config.OPENAI_MODEL,
    };
}

const adminConfigSchema = z.strictObject({
    ADMIN_PASSWORD: z.string().min(7, { error: "至少需要 7 个字符" }),
    ADMIN_SESSION_SECRET: z.string().min(32, { error: "至少需要 32 个字符" }),
});

export interface AdminConfig {
    password: string;
    sessionSecret: string;
}

export function isAdminConfigured(): boolean {
    return adminConfigSchema.safeParse({
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
        ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
    }).success;
}

export function getAdminConfig(): AdminConfig {
    const config = parseConfig(
        adminConfigSchema,
        {
            ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
            ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
        },
        "管理员"
    );

    return {
        password: config.ADMIN_PASSWORD,
        sessionSecret: config.ADMIN_SESSION_SECRET,
    };
}

const anonymousConfigSchema = z.strictObject({
    ANONYMOUS_SESSION_SECRET: z
        .string()
        .min(32, { error: "至少需要 32 个字符" }),
});

export function getAnonymousSessionSecret(): string {
    return parseConfig(
        anonymousConfigSchema,
        { ANONYMOUS_SESSION_SECRET: process.env.ANONYMOUS_SESSION_SECRET },
        "匿名用户 Session"
    ).ANONYMOUS_SESSION_SECRET;
}

const rateLimitConfigSchema = z.strictObject({
    AI_USER_LIMIT_PER_10_MINUTES: positiveIntegerFromEnv(5),
    AI_USER_DAILY_LIMIT: positiveIntegerFromEnv(20),
    AI_IP_LIMIT_PER_10_MINUTES: positiveIntegerFromEnv(20),
    AI_GLOBAL_DAILY_LIMIT: positiveIntegerFromEnv(500),
});

export interface RateLimitConfig {
    userPerTenMinutes: number;
    userDaily: number;
    ipPerTenMinutes: number;
    globalDaily: number;
}

export function getRateLimitConfig(): RateLimitConfig {
    const config = parseConfig(
        rateLimitConfigSchema,
        {
            AI_USER_LIMIT_PER_10_MINUTES:
                process.env.AI_USER_LIMIT_PER_10_MINUTES,
            AI_USER_DAILY_LIMIT: process.env.AI_USER_DAILY_LIMIT,
            AI_IP_LIMIT_PER_10_MINUTES:
                process.env.AI_IP_LIMIT_PER_10_MINUTES,
            AI_GLOBAL_DAILY_LIMIT: process.env.AI_GLOBAL_DAILY_LIMIT,
        },
        "AI 限流"
    );

    return {
        userPerTenMinutes: config.AI_USER_LIMIT_PER_10_MINUTES,
        userDaily: config.AI_USER_DAILY_LIMIT,
        ipPerTenMinutes: config.AI_IP_LIMIT_PER_10_MINUTES,
        globalDaily: config.AI_GLOBAL_DAILY_LIMIT,
    };
}

export function getSiteTitle(): string {
    return process.env.SITE_TITLE?.trim() || "梅花易数";
}
