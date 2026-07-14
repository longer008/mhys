#!/usr/bin/env node

/**
 * 部署前环境变量检查。
 * 只输出变量状态，不输出任何密钥或数据库连接内容。
 */

// 脚本以 CommonJS 运行，Next.js 的环境加载器通过 require 引入。
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd());

const errors = [];
const warnings = [];

function requireValue(name) {
    const value = process.env[name]?.trim();
    if (!value) errors.push(`${name} 未设置`);
    return value;
}

function validateMinLength(name, value, minLength) {
    if (value && value.length < minLength) {
        errors.push(`${name} 至少需要 ${minLength} 个字符`);
    }
}

function validateUrl(name, value, protocols) {
    if (!value) return null;
    try {
        const url = new URL(value);
        if (!protocols.includes(url.protocol)) {
            errors.push(`${name} 协议必须是 ${protocols.join(" 或 ")}`);
        }
        return url;
    } catch {
        errors.push(`${name} 不是合法 URL`);
        return null;
    }
}

console.log("🔍 检查 Vercel 生产环境所需配置\n");

const openAiApiKey = requireValue("OPENAI_API_KEY");
const openAiBaseUrl = requireValue("OPENAI_BASE_URL");
requireValue("OPENAI_MODEL");
const databaseUrlValue = requireValue("DATABASE_URL");
const anonymousSecret = requireValue("ANONYMOUS_SESSION_SECRET");
const adminPassword = requireValue("ADMIN_PASSWORD");
const adminSecret = requireValue("ADMIN_SESSION_SECRET");

if (openAiApiKey && openAiApiKey.length < 8) {
    warnings.push("OPENAI_API_KEY 长度异常，请确认不是示例值");
}
validateUrl("OPENAI_BASE_URL", openAiBaseUrl, ["https:"]);
const databaseUrl = validateUrl("DATABASE_URL", databaseUrlValue, ["postgres:", "postgresql:"]);
validateMinLength("ANONYMOUS_SESSION_SECRET", anonymousSecret, 32);
validateMinLength("ADMIN_PASSWORD", adminPassword, 7);
validateMinLength("ADMIN_SESSION_SECRET", adminSecret, 32);

if (anonymousSecret && adminSecret && anonymousSecret === adminSecret) {
    errors.push("ANONYMOUS_SESSION_SECRET 与 ADMIN_SESSION_SECRET 必须不同");
}

if (!process.env.DIRECT_DATABASE_URL?.trim()) {
    warnings.push("DIRECT_DATABASE_URL 未设置；执行 npm run db:migrate 前必须配置");
} else {
    validateUrl("DIRECT_DATABASE_URL", process.env.DIRECT_DATABASE_URL.trim(), ["postgres:", "postgresql:"]);
}

if (
    databaseUrl &&
    databaseUrl.hostname.includes("pooler.supabase.com") &&
    databaseUrl.port !== "6543"
) {
    warnings.push("Supabase 的 Vercel 运行时连接建议使用 Transaction Pooler 端口 6543");
}

for (const name of [
    "AI_USER_LIMIT_PER_10_MINUTES",
    "AI_USER_DAILY_LIMIT",
    "AI_IP_LIMIT_PER_10_MINUTES",
    "AI_GLOBAL_DAILY_LIMIT",
]) {
    const value = process.env[name]?.trim();
    if (value && (!Number.isInteger(Number(value)) || Number(value) <= 0)) {
        errors.push(`${name} 必须是正整数`);
    }
}

const checked = [
    "OPENAI_API_KEY",
    "OPENAI_BASE_URL",
    "OPENAI_MODEL",
    "DATABASE_URL",
    "ANONYMOUS_SESSION_SECRET",
    "ADMIN_PASSWORD",
    "ADMIN_SESSION_SECRET",
];
for (const name of checked) {
    console.log(`${process.env[name]?.trim() ? "✅" : "❌"} ${name}`);
}

if (warnings.length) {
    console.log("\n⚠️ 提醒：");
    warnings.forEach((message) => console.log(`- ${message}`));
}

if (errors.length) {
    console.log("\n❌ 配置未通过：");
    errors.forEach((message) => console.log(`- ${message}`));
    process.exitCode = 1;
} else {
    console.log("\n✅ 环境变量结构检查通过");
}
