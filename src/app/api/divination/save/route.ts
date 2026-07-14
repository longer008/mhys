import { ApiError } from "@/server/http/api-error";
import { apiFailure, getRequestId } from "@/server/http/response";

export async function POST(request: Request) {
    const requestId = getRequestId(request);
    return apiFailure(
        new ApiError(410, "ENDPOINT_RETIRED", "记录已由解读接口统一保存"),
        requestId,
        { route: "/api/divination/save" }
    );
}
