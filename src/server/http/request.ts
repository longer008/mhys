import { z } from "zod";
import { ApiError } from "@/server/http/api-error";

const DEFAULT_MAX_JSON_BYTES = 16 * 1024;

export async function parseJsonBody<T>(
    request: Request,
    schema: z.ZodType<T>,
    maxBytes = DEFAULT_MAX_JSON_BYTES
): Promise<T> {
    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (declaredLength > maxBytes) {
        throw new ApiError(413, "REQUEST_TOO_LARGE", "请求内容过大");
    }

    const bodyText = await request.text();
    if (new TextEncoder().encode(bodyText).byteLength > maxBytes) {
        throw new ApiError(413, "REQUEST_TOO_LARGE", "请求内容过大");
    }

    let payload: unknown;
    try {
        payload = JSON.parse(bodyText);
    } catch {
        throw new ApiError(400, "INVALID_JSON", "请求内容不是合法 JSON");
    }

    const result = schema.safeParse(payload);
    if (!result.success) {
        const message = result.error.issues
            .map((issue) => `${issue.path.join(".") || "请求"}: ${issue.message}`)
            .join("；");
        throw new ApiError(400, "INVALID_REQUEST", message);
    }

    return result.data;
}
