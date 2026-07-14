import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isApiError } from "@/server/http/api-error";
import { logError } from "@/server/observability/logger";

export function getRequestId(request: Request): string {
    return request.headers.get("x-vercel-id") || randomUUID();
}

export function apiSuccess<T>(data: T, requestId: string, status = 200) {
    return NextResponse.json(
        { ok: true, data, requestId },
        {
            status,
            headers: { "x-request-id": requestId },
        }
    );
}

export function apiFailure(
    error: unknown,
    requestId: string,
    context: Record<string, unknown> = {}
) {
    if (isApiError(error)) {
        const headers = new Headers({ "x-request-id": requestId });
        if (error.retryAfterSeconds) {
            headers.set("Retry-After", String(error.retryAfterSeconds));
        }

        return NextResponse.json(
            {
                ok: false,
                error: { code: error.code, message: error.message },
                requestId,
            },
            { status: error.status, headers }
        );
    }

    logError("api_unhandled_error", error, { requestId, ...context });
    return NextResponse.json(
        {
            ok: false,
            error: { code: "INTERNAL_ERROR", message: "服务器内部错误" },
            requestId,
        },
        {
            status: 500,
            headers: { "x-request-id": requestId },
        }
    );
}
