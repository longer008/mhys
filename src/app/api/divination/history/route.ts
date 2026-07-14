import { ApiError } from "@/server/http/api-error";
import { apiFailure, getRequestId } from "@/server/http/response";

export const runtime = "nodejs";

function retiredHistoryResponse(request: Request) {
    const requestId = getRequestId(request);
    return apiFailure(
        new ApiError(410, "ENDPOINT_RETIRED", "历史记录仅保存在当前浏览器"),
        requestId,
        { route: "/api/divination/history" }
    );
}

export const GET = retiredHistoryResponse;
export const DELETE = retiredHistoryResponse;
