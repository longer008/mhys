import { requireAdminSession } from "@/server/auth/admin-request";
import { getSiteTitle } from "@/server/config/env";
import { apiFailure, apiSuccess, getRequestId } from "@/server/http/response";

export const runtime = "nodejs";

export async function GET(request: Request) {
    const requestId = getRequestId(request);
    try {
        await requireAdminSession();
        return apiSuccess({ siteTitle: getSiteTitle() }, requestId);
    } catch (error) {
        return apiFailure(error, requestId, { route: "/api/admin/settings" });
    }
}
