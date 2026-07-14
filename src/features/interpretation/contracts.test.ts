import { describe, expect, it } from "vitest";
import {
    interpretationRequestSchema,
    toPersistedInterpretationRequest,
} from "@/features/interpretation/contracts";

const validRequest = {
    clientRequestId: "58cbd270-74e0-4d39-9b3f-6b817afcbf41",
    question: "未来三个月工作方向应如何取舍？",
    method: "time",
    numbers: {
        num1: 12,
        num2: 24,
        num3: 36,
        movingLine: 6,
    },
    timeContext: {
        occurredAt: "2026-07-13T08:00:00.000Z",
        timeZone: "Asia/Shanghai",
        lunarMonth: -6,
        lunarDay: 29,
        season: "夏",
    },
};

describe("AI 解读请求校验", () => {
    it("接受合法请求与负数闰月", () => {
        expect(interpretationRequestSchema.safeParse(validRequest).success).toBe(true);
    });

    it("拒绝非正整数和越界动爻", () => {
        const parsed = interpretationRequestSchema.safeParse({
            ...validRequest,
            numbers: { ...validRequest.numbers, num1: 0, movingLine: 7 },
        });
        expect(parsed.success).toBe(false);
    });

    it("拒绝超长问题和顶层未声明字段", () => {
        const parsed = interpretationRequestSchema.safeParse({
            ...validRequest,
            question: "问".repeat(501),
            unknownField: true,
        });
        expect(parsed.success).toBe(false);
    });

    it("接受 OpenAI 兼容配置并在持久化前完整剥离", () => {
        const parsed = interpretationRequestSchema.parse({
            ...validRequest,
            aiConfig: {
                baseUrl: "https://api.example.com/v1",
                apiKey: "local-only-key",
                model: "example-model",
            },
        });
        const persisted = toPersistedInterpretationRequest(parsed);

        expect(parsed.aiConfig?.apiKey).toBe("local-only-key");
        expect(persisted).not.toHaveProperty("aiConfig");
        expect(JSON.stringify(persisted)).not.toContain("local-only-key");
        expect(JSON.stringify(persisted)).not.toContain("api.example.com");
        expect(JSON.stringify(persisted)).not.toContain("example-model");
    });

    it("拒绝非 HTTPS 自定义 API 地址", () => {
        const parsed = interpretationRequestSchema.safeParse({
            ...validRequest,
            aiConfig: {
                baseUrl: "http://api.example.com/v1",
                apiKey: "local-only-key",
                model: "example-model",
            },
        });
        expect(parsed.success).toBe(false);
    });
});
