import { cookies } from "next/headers";
import { z } from "zod";
import {
    ADMIN_SESSION_COOKIE,
    ADMIN_SESSION_MAX_AGE,
    createAdminSessionToken,
    verifyAdminPassword,
} from "@/server/auth/admin-session";
import { hasValidAdminSession } from "@/server/auth/admin-request";
import { getAdminConfig, isAdminConfigured } from "@/server/config/env";
import { isDatabaseConfigured } from "@/server/db/client";
import { ApiError } from "@/server/http/api-error";
import { assertSameOrigin } from "@/server/http/origin";
import { parseJsonBody } from "@/server/http/request";
import { apiFailure, apiSuccess, getRequestId } from "@/server/http/response";
import {
    enforceRateLimit,
    getRequestIp,
    hashRateLimitKey,
} from "@/server/security/rate-limit";

export const runtime = "nodejs";

const loginSchema = z.strictObject({
    password: z.string().min(1).max(256),
});

export async function POST(request: Request) {
    const requestId = getRequestId(request);

    try {
        assertSameOrigin(request);

        if (!isDatabaseConfigured() || !isAdminConfigured()) {
            throw new ApiError(503, "ADMIN_UNAVAILABLE", "管理后台尚未配置");
        }

        const { password } = await parseJsonBody(request, loginSchema, 4 * 1024);
        const config = getAdminConfig();
        const keyHash = hashRateLimitKey(
            "admin-login",
            getRequestIp(request),
            config.sessionSecret
        );
        await enforceRateLimit({
            scope: "admin_login_15m",
            keyHash,
            limit: 5,
            windowSeconds: 15 * 60,
        });

        if (!verifyAdminPassword(password)) {
            throw new ApiError(401, "INVALID_CREDENTIALS", "密码错误");
        }

        const response = apiSuccess({ message: "登录成功" }, requestId);
        response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(), {
            maxAge: ADMIN_SESSION_MAX_AGE,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
        });
        return response;
    } catch (error) {
        return apiFailure(error, requestId, { route: "/api/admin/auth" });
    }
}

export async function GET(request: Request) {
    const requestId = getRequestId(request);

    try {
        const dbEnabled = isDatabaseConfigured();
        const authenticated = dbEnabled && await hasValidAdminSession();
        return apiSuccess({ authenticated, dbEnabled }, requestId);
    } catch (error) {
        return apiFailure(error, requestId, { route: "/api/admin/auth" });
    }
}

export async function DELETE(request: Request) {
    const requestId = getRequestId(request);

    try {
        assertSameOrigin(request);
        const cookieStore = await cookies();
        cookieStore.delete(ADMIN_SESSION_COOKIE);
        return apiSuccess({ success: true }, requestId);
    } catch (error) {
        return apiFailure(error, requestId, { route: "/api/admin/auth" });
    }
}
