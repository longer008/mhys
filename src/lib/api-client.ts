export interface ApiErrorPayload {
    code?: string;
    message: string;
}

export interface ApiEnvelope<T> {
    ok: boolean;
    data?: T;
    error?: ApiErrorPayload;
    requestId?: string;
}

export async function fetchApi<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
    const response = await fetch(input, init);
    const responseText = await response.text();
    let payload: ApiEnvelope<T> | null = null;
    try {
        payload = JSON.parse(responseText) as ApiEnvelope<T>;
    } catch {
        // 网关超时等场景可能返回 HTML，统一转换为可理解的客户端错误。
    }

    if (!response.ok || !payload?.ok || payload.data === undefined) {
        throw new Error(payload?.error?.message || "服务暂时不可用，请稍后重试");
    }

    return payload.data;
}
