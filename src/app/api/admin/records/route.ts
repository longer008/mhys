import { z } from "zod";
import { requireAdminSession } from "@/server/auth/admin-request";
import { isDatabaseConfigured } from "@/server/db/client";
import { deleteAdminRecord, listAdminRecords } from "@/server/db/admin-repository";
import { ApiError } from "@/server/http/api-error";
import { assertSameOrigin } from "@/server/http/origin";
import { parseJsonBody } from "@/server/http/request";
import { apiFailure, apiSuccess, getRequestId } from "@/server/http/response";

export const runtime = "nodejs";

const querySchema = z.strictObject({
    page: z.coerce.number().int().min(1).max(100_000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
});

const deleteSchema = z.strictObject({ id: z.uuid() });

export async function GET(request: Request) {
    const requestId = getRequestId(request);

    try {
        await requireAdminSession();
        if (!isDatabaseConfigured()) {
            throw new ApiError(503, "DATABASE_UNAVAILABLE", "数据库尚未配置");
        }

        const url = new URL(request.url);
        const parsed = querySchema.safeParse({
            page: url.searchParams.get("page") || undefined,
            pageSize: url.searchParams.get("pageSize") || undefined,
            search: url.searchParams.get("search") || undefined,
        });
        if (!parsed.success) {
            throw new ApiError(400, "INVALID_QUERY", "分页或搜索参数无效");
        }

        const { page, pageSize, search } = parsed.data;
        const { records, total } = await listAdminRecords({ page, pageSize, search });
        return apiSuccess({
            records,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        }, requestId);
    } catch (error) {
        return apiFailure(error, requestId, { route: "/api/admin/records" });
    }
}

export async function DELETE(request: Request) {
    const requestId = getRequestId(request);

    try {
        assertSameOrigin(request);
        await requireAdminSession();
        const { id } = await parseJsonBody(request, deleteSchema, 4 * 1024);
        const deleted = await deleteAdminRecord(id);
        if (!deleted) {
            throw new ApiError(404, "RECORD_NOT_FOUND", "记录不存在");
        }
        return apiSuccess({ deleted: true }, requestId);
    } catch (error) {
        return apiFailure(error, requestId, { route: "/api/admin/records" });
    }
}
