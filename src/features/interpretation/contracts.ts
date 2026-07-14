import { z } from "zod";

const divinationNumberSchema = z
    .number()
    .int({ error: "必须是整数" })
    .min(1, { error: "必须大于 0" })
    .max(999_999_999, { error: "数字过大" });

const timeContextSchema = z.strictObject({
    occurredAt: z
        .string()
        .max(64)
        .refine((value) => !Number.isNaN(Date.parse(value)), {
            error: "时间格式无效",
        }),
    timeZone: z.string().trim().min(1).max(64),
    lunarMonth: z.number().int().min(-12).max(12).refine((value) => value !== 0),
    lunarDay: z.number().int().min(1).max(30),
    season: z.enum(["春", "夏", "秋", "冬", "未知"]),
});

export const customAiConfigSchema = z.strictObject({
    baseUrl: z
        .string()
        .trim()
        .url({ error: "API 地址格式无效" })
        .max(2048)
        .refine((value) => new URL(value).protocol === "https:", {
            error: "API 地址必须使用 HTTPS",
        }),
    apiKey: z.string().trim().min(1, { error: "API Key 不能为空" }).max(512),
    model: z.string().trim().min(1, { error: "模型名称不能为空" }).max(128),
});

export const interpretationRequestSchema = z.strictObject({
    clientRequestId: z.uuid(),
    question: z.string().trim().min(1, { error: "问题不能为空" }).max(500),
    method: z.enum(["manual", "random", "time"]),
    numbers: z.strictObject({
        num1: divinationNumberSchema,
        num2: divinationNumberSchema,
        num3: divinationNumberSchema,
        movingLine: z.number().int().min(1).max(6).optional(),
    }),
    timeContext: timeContextSchema,
    aiConfig: customAiConfigSchema.optional(),
});

export type InterpretationRequest = z.infer<typeof interpretationRequestSchema>;
export type CustomAiRequestConfig = z.infer<typeof customAiConfigSchema>;
export type PersistedInterpretationRequest = Omit<InterpretationRequest, "aiConfig">;

export function toPersistedInterpretationRequest(
    input: InterpretationRequest
): PersistedInterpretationRequest {
    const { aiConfig, ...request } = input;
    void aiConfig;
    return request;
}
