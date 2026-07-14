import type { DivinationResult } from "@/lib/meihua";
import type { PersistedInterpretationRequest } from "@/features/interpretation/contracts";
import { getDb } from "@/server/db/client";

export interface StoredDivinationRecord {
    id: string;
    user_id: string;
    question: string;
    result: DivinationResult;
    interpretation: string | null;
    client_request_id: string;
    status: "pending" | "completed" | "failed";
    input: PersistedInterpretationRequest;
    provider: string | null;
    model: string | null;
    latency_ms: number | null;
    input_tokens: number | null;
    output_tokens: number | null;
    error_code: string | null;
    created_at: Date;
    updated_at: Date;
}

export type PendingRecordResult =
    | { state: "created"; record: StoredDivinationRecord }
    | { state: "completed"; record: StoredDivinationRecord }
    | { state: "pending"; record: StoredDivinationRecord };

async function upsertUser(userId: string): Promise<void> {
    const sql = getDb();
    await sql`
        INSERT INTO users (id, last_visit)
        VALUES (${userId}, NOW())
        ON CONFLICT (id) DO UPDATE SET last_visit = NOW()
    `;
}

export async function createOrReusePendingRecord(options: {
    userId: string;
    input: PersistedInterpretationRequest;
    result: DivinationResult;
    provider: string | null;
    model: string | null;
}): Promise<PendingRecordResult> {
    const sql = getDb();
    await upsertUser(options.userId);

    const [created] = await sql<StoredDivinationRecord[]>`
        INSERT INTO divination_records (
            user_id,
            question,
            result,
            interpretation,
            client_request_id,
            status,
            input,
            provider,
            model,
            updated_at
        )
        VALUES (
            ${options.userId},
            ${options.input.question},
            ${sql.json(options.result as never)},
            NULL,
            ${options.input.clientRequestId},
            'pending',
            ${sql.json(options.input as never)},
            ${options.provider},
            ${options.model},
            NOW()
        )
        ON CONFLICT (user_id, client_request_id)
            WHERE client_request_id IS NOT NULL
        DO NOTHING
        RETURNING *
    `;

    if (created) return { state: "created", record: created };

    const [existing] = await sql<StoredDivinationRecord[]>`
        SELECT *
        FROM divination_records
        WHERE user_id = ${options.userId}
          AND client_request_id = ${options.input.clientRequestId}
        LIMIT 1
    `;

    if (!existing) {
        throw new Error("幂等记录查询失败");
    }

    if (existing.status === "completed" && existing.interpretation) {
        return { state: "completed", record: existing };
    }

    if (existing.status === "pending") {
        return { state: "pending", record: existing };
    }

    const [retried] = await sql<StoredDivinationRecord[]>`
        UPDATE divination_records
        SET
            status = 'pending',
            error_code = NULL,
            provider = ${options.provider},
            model = ${options.model},
            updated_at = NOW()
        WHERE id = ${existing.id}
          AND user_id = ${options.userId}
        RETURNING *
    `;

    return { state: "created", record: retried };
}

export async function completeInterpretationRecord(options: {
    recordId: string;
    userId: string;
    interpretation: string;
    provider: string | null;
    model: string | null;
    latencyMs: number;
    inputTokens?: number;
    outputTokens?: number;
}): Promise<StoredDivinationRecord> {
    const sql = getDb();
    const [record] = await sql<StoredDivinationRecord[]>`
        UPDATE divination_records
        SET
            interpretation = ${options.interpretation},
            status = 'completed',
            provider = ${options.provider},
            model = ${options.model},
            latency_ms = ${options.latencyMs},
            input_tokens = ${options.inputTokens ?? null},
            output_tokens = ${options.outputTokens ?? null},
            error_code = NULL,
            updated_at = NOW()
        WHERE id = ${options.recordId}
          AND user_id = ${options.userId}
        RETURNING *
    `;

    if (!record) throw new Error("解读记录更新失败");
    return record;
}

export async function failInterpretationRecord(options: {
    recordId: string;
    userId: string;
    errorCode: string;
}): Promise<void> {
    const sql = getDb();
    await sql`
        UPDATE divination_records
        SET status = 'failed', error_code = ${options.errorCode}, updated_at = NOW()
        WHERE id = ${options.recordId}
          AND user_id = ${options.userId}
    `;
}
