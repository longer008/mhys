import { getDb } from "@/server/db/client";

export interface AdminDivinationRecord {
    id: string;
    user_id: string;
    question: string | null;
    result: unknown;
    interpretation: string | null;
    status: "pending" | "completed" | "failed";
    provider: string | null;
    model: string | null;
    latency_ms: number | null;
    error_code: string | null;
    created_at: Date;
}

export async function listAdminRecords(options: {
    page: number;
    pageSize: number;
    search?: string;
}): Promise<{ records: AdminDivinationRecord[]; total: number }> {
    const sql = getDb();
    const offset = (options.page - 1) * options.pageSize;

    if (options.search) {
        const searchPattern = `%${options.search}%`;
        const [records, countRows] = await Promise.all([
            sql<AdminDivinationRecord[]>`
                SELECT
                    id, user_id, question, result, interpretation, status,
                    provider, model, latency_ms, error_code, created_at
                FROM divination_records
                WHERE question ILIKE ${searchPattern}
                ORDER BY created_at DESC
                LIMIT ${options.pageSize} OFFSET ${offset}
            `,
            sql<[{ count: string }]>`
                SELECT COUNT(*) AS count
                FROM divination_records
                WHERE question ILIKE ${searchPattern}
            `,
        ]);
        return { records, total: Number(countRows[0].count) };
    }

    const [records, countRows] = await Promise.all([
        sql<AdminDivinationRecord[]>`
            SELECT
                id, user_id, question, result, interpretation, status,
                provider, model, latency_ms, error_code, created_at
            FROM divination_records
            ORDER BY created_at DESC
            LIMIT ${options.pageSize} OFFSET ${offset}
        `,
        sql<[{ count: string }]>`
            SELECT COUNT(*) AS count FROM divination_records
        `,
    ]);
    return { records, total: Number(countRows[0].count) };
}

export async function deleteAdminRecord(recordId: string): Promise<boolean> {
    const sql = getDb();
    const deleted = await sql`
        DELETE FROM divination_records
        WHERE id = ${recordId}
        RETURNING id
    `;
    return deleted.length > 0;
}

export async function getAdminStats(): Promise<{
    totalUsers: number;
    totalDivinations: number;
    todayDivinations: number;
}> {
    const sql = getDb();
    const [rows] = await sql<[{ total_users: string; total_divinations: string; today_divinations: string }]>`
        SELECT
            (SELECT COUNT(*) FROM users) AS total_users,
            (SELECT COUNT(*) FROM divination_records WHERE status = 'completed') AS total_divinations,
            (
                SELECT COUNT(*)
                FROM divination_records
                WHERE status = 'completed' AND created_at >= CURRENT_DATE
            ) AS today_divinations
    `;

    return {
        totalUsers: Number(rows.total_users),
        totalDivinations: Number(rows.total_divinations),
        todayDivinations: Number(rows.today_divinations),
    };
}
