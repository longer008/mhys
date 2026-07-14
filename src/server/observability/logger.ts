type LogContext = Record<string, unknown>;

function sanitizeErrorMessage(message: string): string {
    return message
        .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[DATABASE_URL_REDACTED]")
        .replace(/Bearer\s+[^\s]+/gi, "Bearer [REDACTED]")
        .replace(/sk-[A-Za-z0-9_-]+/g, "sk-[REDACTED]")
        .slice(0, 500);
}

function write(level: "info" | "warn" | "error", event: string, context: LogContext) {
    const payload = JSON.stringify({
        level,
        event,
        timestamp: new Date().toISOString(),
        ...context,
    });

    if (level === "error") {
        console.error(payload);
    } else if (level === "warn") {
        console.warn(payload);
    } else {
        console.info(payload);
    }
}

export function logInfo(event: string, context: LogContext = {}) {
    write("info", event, context);
}

export function logWarn(event: string, context: LogContext = {}) {
    write("warn", event, context);
}

export function logError(
    event: string,
    error: unknown,
    context: LogContext = {}
) {
    write("error", event, {
        ...context,
        errorName: error instanceof Error ? error.name : "UnknownError",
        errorMessage: error instanceof Error
            ? sanitizeErrorMessage(error.message)
            : "未知错误",
    });
}
