import { requireAdminSession } from "@/server/auth/admin-request";
import {
    settingsSectionResetSchema,
    settingsSectionUpdateSchema,
} from "@/features/settings/contracts";
import { assertSameOrigin } from "@/server/http/origin";
import { parseJsonBody } from "@/server/http/request";
import { apiFailure, apiSuccess, getRequestId } from "@/server/http/response";
import { logInfo } from "@/server/observability/logger";
import {
    getAdminSettingsSnapshot,
    resetSettingsSection,
    updateSettingsSection,
} from "@/server/settings/runtime-settings";

export const runtime = "nodejs";

export async function GET(request: Request) {
    const requestId = getRequestId(request);
    try {
        await requireAdminSession();
        const response = apiSuccess(await getAdminSettingsSnapshot(), requestId);
        response.headers.set("Cache-Control", "private, no-store");
        return response;
    } catch (error) {
        return apiFailure(error, requestId, { route: "/api/admin/settings" });
    }
}

export async function PUT(request: Request) {
    const requestId = getRequestId(request);
    try {
        assertSameOrigin(request);
        await requireAdminSession();
        const update = await parseJsonBody(
            request,
            settingsSectionUpdateSchema,
            16 * 1024
        );
        await updateSettingsSection(update);
        logInfo("admin_setting_updated", {
            requestId,
            section: update.section,
        });
        return apiSuccess(await getAdminSettingsSnapshot(), requestId);
    } catch (error) {
        return apiFailure(error, requestId, { route: "/api/admin/settings" });
    }
}

export async function DELETE(request: Request) {
    const requestId = getRequestId(request);
    try {
        assertSameOrigin(request);
        await requireAdminSession();
        const { section } = await parseJsonBody(
            request,
            settingsSectionResetSchema,
            4 * 1024
        );
        await resetSettingsSection(section);
        logInfo("admin_setting_reset", { requestId, section });
        return apiSuccess(await getAdminSettingsSnapshot(), requestId);
    } catch (error) {
        return apiFailure(error, requestId, { route: "/api/admin/settings" });
    }
}
