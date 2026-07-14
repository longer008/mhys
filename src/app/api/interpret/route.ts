import { cookies } from "next/headers";
import {
    ANONYMOUS_SESSION_COOKIE,
    ANONYMOUS_SESSION_MAX_AGE,
    resolveAnonymousSession,
    type AnonymousSession,
} from "@/server/auth/anonymous-session";
import { isDatabaseConfigured } from "@/server/db/client";
import { interpretationRequestSchema } from "@/features/interpretation/contracts";
import { interpretDivination } from "@/features/interpretation/service";
import { ApiError } from "@/server/http/api-error";
import { assertSameOrigin } from "@/server/http/origin";
import { parseJsonBody } from "@/server/http/request";
import {
    apiFailure,
    apiSuccess,
    getRequestId,
} from "@/server/http/response";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
    const requestId = getRequestId(request);
    let anonymousSession: AnonymousSession | undefined;

    try {
        assertSameOrigin(request);

        if (!isDatabaseConfigured()) {
            throw new ApiError(503, "DATABASE_UNAVAILABLE", "数据库尚未配置");
        }

        const input = await parseJsonBody(request, interpretationRequestSchema);
        const cookieStore = await cookies();
        anonymousSession = resolveAnonymousSession(
            cookieStore.get(ANONYMOUS_SESSION_COOKIE)?.value
        );

        const result = await interpretDivination({
            request,
            requestId,
            userId: anonymousSession.userId,
            input,
        });
        const response = apiSuccess(result, requestId);

        if (anonymousSession.isNew) {
            response.cookies.set(ANONYMOUS_SESSION_COOKIE, anonymousSession.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: ANONYMOUS_SESSION_MAX_AGE,
            });
        }

        return response;
    } catch (error) {
        const response = apiFailure(error, requestId, { route: "/api/interpret" });
        if (anonymousSession?.isNew) {
            response.cookies.set(ANONYMOUS_SESSION_COOKIE, anonymousSession.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: ANONYMOUS_SESSION_MAX_AGE,
            });
        }
        return response;
    }
}
