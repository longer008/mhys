import { requireAdminSession } from "@/server/auth/admin-request";
import { getAdminStats } from "@/server/db/admin-repository";
import { apiFailure, apiSuccess, getRequestId } from "@/server/http/response";

export const runtime = "nodejs";

export async function GET(request: Request) {
    const requestId = getRequestId(request);
    try {
        await requireAdminSession();
        return apiSuccess({ enabled: true, ...await getAdminStats() }, requestId);
    } catch (error) {
        return apiFailure(error, requestId, { route: "/api/stats" });
    }
}
