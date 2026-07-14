import { cookies } from "next/headers";
import {
    ADMIN_SESSION_COOKIE,
    verifyAdminSessionToken,
} from "@/server/auth/admin-session";
import { isAdminConfigured } from "@/server/config/env";
import { ApiError } from "@/server/http/api-error";

export async function hasValidAdminSession(): Promise<boolean> {
    if (!isAdminConfigured()) return false;

    const cookieStore = await cookies();
    return verifyAdminSessionToken(
        cookieStore.get(ADMIN_SESSION_COOKIE)?.value
    );
}

export async function requireAdminSession(): Promise<void> {
    if (!isAdminConfigured()) {
        throw new ApiError(503, "ADMIN_UNAVAILABLE", "管理后台尚未配置");
    }

    if (!await hasValidAdminSession()) {
        throw new ApiError(401, "UNAUTHORIZED", "管理员身份无效或已过期");
    }
}
