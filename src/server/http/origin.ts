import { ApiError } from "@/server/http/api-error";

const DEVELOPMENT_LOOPBACK_HOSTS = new Set([
    "localhost",
    "127.0.0.1",
    "[::1]",
]);

function isEquivalentDevelopmentOrigin(
    origin: string,
    requestOrigin: string
): boolean {
    if (process.env.NODE_ENV === "production") return false;

    try {
        const originUrl = new URL(origin);
        const requestUrl = new URL(requestOrigin);
        return (
            originUrl.origin === origin &&
            originUrl.protocol === requestUrl.protocol &&
            originUrl.port === requestUrl.port &&
            DEVELOPMENT_LOOPBACK_HOSTS.has(originUrl.hostname) &&
            DEVELOPMENT_LOOPBACK_HOSTS.has(requestUrl.hostname)
        );
    } catch {
        return false;
    }
}

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
    if (
        origin !== requestOrigin &&
        !isEquivalentDevelopmentOrigin(origin, requestOrigin)
    ) {
        throw new ApiError(403, "INVALID_ORIGIN", "请求来源无效");
    }
}
