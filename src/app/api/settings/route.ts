import { apiFailure, apiSuccess, getRequestId } from "@/server/http/response";
import { getPublicSiteSettings } from "@/server/settings/runtime-settings";

export const runtime = "nodejs";

export async function GET(request: Request) {
    const requestId = getRequestId(request);
    try {
        const response = apiSuccess(await getPublicSiteSettings(), requestId);
        response.headers.set("Cache-Control", "no-store");
        return response;
    } catch (error) {
        return apiFailure(error, requestId, { route: "/api/settings" });
    }
}
