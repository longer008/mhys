import { ApiError } from "@/server/http/api-error";

export function assertSameOrigin(request: Request): void {
    const origin = request.headers.get("origin");

    // 浏览器的写请求会携带 Origin；本地测试环境允许缺省。
    if (!origin) {
        if (process.env.NODE_ENV === "production") {
            throw new ApiError(403, "INVALID_ORIGIN", "请求来源无效");
        }
        return;
    }

    const requestOrigin = new URL(request.url).origin;
    if (origin !== requestOrigin) {
        throw new ApiError(403, "INVALID_ORIGIN", "请求来源无效");
    }
}
