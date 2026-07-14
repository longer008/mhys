import { calculateHexagrams } from "@/lib/meihua";
import {
    toPersistedInterpretationRequest,
    type InterpretationRequest,
} from "@/features/interpretation/contracts";
import {
    buildInterpretationUserPrompt,
    INTERPRETATION_PROMPT_VERSION,
    INTERPRETATION_SYSTEM_PROMPT,
} from "@/features/interpretation/prompt";
import { requestAiInterpretation } from "@/server/ai/openai-compatible";
import {
    completeInterpretationRecord,
    createOrReusePendingRecord,
    failInterpretationRecord,
} from "@/server/db/divination-repository";
import {
    getAiConfig,
    getAnonymousSessionSecret,
    getRateLimitConfig,
} from "@/server/config/env";
import { ApiError, isApiError } from "@/server/http/api-error";
import { logInfo, logWarn } from "@/server/observability/logger";
import {
    enforceRateLimit,
    getRequestIp,
    hashRateLimitKey,
} from "@/server/security/rate-limit";

async function enforceAiLimits(
    request: Request,
    userId: string
): Promise<void> {
    const limits = getRateLimitConfig();
    const secret = getAnonymousSessionSecret();
    const ip = getRequestIp(request);

    const userHash = hashRateLimitKey("ai-user", userId, secret);
    const ipHash = hashRateLimitKey("ai-ip", ip, secret);
    const globalHash = hashRateLimitKey("ai-global", "all", secret);

    await enforceRateLimit({
        scope: "ai_user_10m",
        keyHash: userHash,
        limit: limits.userPerTenMinutes,
        windowSeconds: 10 * 60,
    });
    await enforceRateLimit({
        scope: "ai_user_daily",
        keyHash: userHash,
        limit: limits.userDaily,
        windowSeconds: 24 * 60 * 60,
    });
    await enforceRateLimit({
        scope: "ai_ip_10m",
        keyHash: ipHash,
        limit: limits.ipPerTenMinutes,
        windowSeconds: 10 * 60,
    });
    await enforceRateLimit({
        scope: "ai_global_daily",
        keyHash: globalHash,
        limit: limits.globalDaily,
        windowSeconds: 24 * 60 * 60,
    });
}

export async function interpretDivination(options: {
    request: Request;
    requestId: string;
    userId: string;
    input: InterpretationRequest;
}) {
    const { request, requestId, userId, input } = options;
    await enforceAiLimits(request, userId);

    const result = calculateHexagrams(
        input.numbers.num1,
        input.numbers.num2,
        input.numbers.num3,
        input.numbers.movingLine,
        input.method,
        new Date(input.timeContext.occurredAt)
    );
    const customAiConfig = input.aiConfig;
    const aiConfig = customAiConfig || getAiConfig();
    const persistedInput = toPersistedInterpretationRequest(input);

    const pending = await createOrReusePendingRecord({
        userId,
        input: persistedInput,
        result,
        provider: customAiConfig ? null : new URL(aiConfig.baseUrl).host,
        model: customAiConfig ? null : aiConfig.model,
    });

    if (pending.state === "completed") {
        logInfo("ai_idempotent_hit", { requestId, recordId: pending.record.id });
        return {
            recordId: pending.record.id,
            result: pending.record.result,
            interpretation: pending.record.interpretation!,
            cached: true,
        };
    }

    if (pending.state === "pending") {
        throw new ApiError(409, "REQUEST_IN_PROGRESS", "该解读正在处理中");
    }

    const userPrompt = buildInterpretationUserPrompt(input, result);
    logInfo("ai_request_started", {
        requestId,
        recordId: pending.record.id,
        method: input.method,
        questionLength: input.question.length,
        promptVersion: INTERPRETATION_PROMPT_VERSION,
    });

    try {
        const aiResult = await requestAiInterpretation({
            systemPrompt: INTERPRETATION_SYSTEM_PROMPT,
            userPrompt,
            config: customAiConfig,
        });

        const record = await completeInterpretationRecord({
            recordId: pending.record.id,
            userId,
            interpretation: aiResult.interpretation,
            provider: customAiConfig ? null : aiResult.provider,
            model: customAiConfig ? null : aiResult.model,
            latencyMs: aiResult.latencyMs,
            inputTokens: aiResult.inputTokens,
            outputTokens: aiResult.outputTokens,
        });

        logInfo("ai_request_completed", {
            requestId,
            recordId: record.id,
            latencyMs: aiResult.latencyMs,
            inputTokens: aiResult.inputTokens,
            outputTokens: aiResult.outputTokens,
        });

        return {
            recordId: record.id,
            result,
            interpretation: aiResult.interpretation,
            cached: false,
        };
    } catch (error) {
        const errorCode = isApiError(error) ? error.code : "AI_INTERNAL_ERROR";
        await failInterpretationRecord({
            recordId: pending.record.id,
            userId,
            errorCode,
        }).catch(() => undefined);

        logWarn("ai_request_failed", {
            requestId,
            recordId: pending.record.id,
            errorCode,
        });
        throw error;
    }
}
