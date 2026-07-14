import { createHmac } from "node:crypto";
import { getDb } from "@/server/db/client";
import { ApiError } from "@/server/http/api-error";

interface RateLimitRow {
    request_count: number;
    window_started_at: Date;
}

export interface RateLimitDecision {
    allowed: boolean;
    limit: number;
    remaining: number;
    retryAfterSeconds: number;
}

export function hashRateLimitKey(
    scope: string,
    rawValue: string,
    secret: string
): string {
    return createHmac("sha256", secret)
        .update(`${scope}:${rawValue}`)
        .digest("hex");
}

export function getRequestIp(request: Request): string {
    const forwarded = process.env.NODE_ENV === "production"
        ? request.headers.get("x-vercel-forwarded-for")
        : request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");

    return forwarded?.split(",")[0]?.trim() || "unknown";
}

export async function consumeRateLimit(options: {
    scope: string;
    keyHash: string;
    limit: number;
    windowSeconds: number;
}): Promise<RateLimitDecision> {
    const sql = getDb();
    const { scope, keyHash, limit, windowSeconds } = options;

    const [row] = await sql<RateLimitRow[]>`
        INSERT INTO rate_limit_counters (
            scope,
            key_hash,
            window_started_at,
            window_seconds,
            request_count,
            updated_at
        )
        VALUES (${scope}, ${keyHash}, NOW(), ${windowSeconds}, 1, NOW())
        ON CONFLICT (scope, key_hash) DO UPDATE SET
            window_started_at = CASE
                WHEN rate_limit_counters.window_started_at
                    <= NOW() - (${windowSeconds} * INTERVAL '1 second')
                THEN NOW()
                ELSE rate_limit_counters.window_started_at
            END,
            request_count = CASE
                WHEN rate_limit_counters.window_started_at
                    <= NOW() - (${windowSeconds} * INTERVAL '1 second')
                THEN 1
                ELSE rate_limit_counters.request_count + 1
            END,
            window_seconds = ${windowSeconds},
            updated_at = NOW()
        RETURNING request_count, window_started_at
    `;

    const resetAt = row.window_started_at.getTime() + windowSeconds * 1000;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));

    return {
        allowed: row.request_count <= limit,
        limit,
        remaining: Math.max(0, limit - row.request_count),
        retryAfterSeconds,
    };
}

export async function enforceRateLimit(options: {
    scope: string;
    keyHash: string;
    limit: number;
    windowSeconds: number;
}): Promise<void> {
    const decision = await consumeRateLimit(options);
    if (!decision.allowed) {
        throw new ApiError(
            429,
            "RATE_LIMITED",
            "请求过于频繁，请稍后再试",
            decision.retryAfterSeconds
        );
    }
}
