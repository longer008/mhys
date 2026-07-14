import {
    getDb,
    isDatabaseConfigured,
} from '@/server/db/client';

export function isDbEnabled(): boolean {
    return isDatabaseConfigured();
}

// 数据库类型定义
export interface DbUser {
    id: string;
    created_at: Date;
    last_visit: Date;
}

export interface DbDivinationRecord {
    id: string;
    user_id: string;
    question: string | null;
    result: unknown;
    interpretation: string | null;
    client_request_id: string | null;
    status: 'pending' | 'completed' | 'failed';
    input: unknown | null;
    provider: string | null;
    model: string | null;
    latency_ms: number | null;
    input_tokens: number | null;
    output_tokens: number | null;
    error_code: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface DbSettings {
    key: string;
    value: unknown;
    updated_at: Date;
}

// 数据库结构改由 scripts/migrate.mjs 显式迁移，运行时禁止执行 DDL。
export async function initDatabase(): Promise<void> {
    return;
}

// 用户操作
export async function getOrCreateUser(userId: string): Promise<DbUser> {
    const sql = getDb();

    const [user] = await sql<DbUser[]>`
        INSERT INTO users (id, last_visit)
        VALUES (${userId}, NOW())
        ON CONFLICT (id) DO UPDATE SET last_visit = NOW()
        RETURNING *
    `;

    return user;
}

// 占卜记录操作
export async function saveDivinationRecord(
    userId: string,
    question: string,
    result: unknown,
    interpretation: string
): Promise<DbDivinationRecord> {
    const sql = getDb();

    // 确保用户存在
    await getOrCreateUser(userId);

    const [record] = await sql<DbDivinationRecord[]>`
        INSERT INTO divination_records (user_id, question, result, interpretation)
        VALUES (${userId}, ${question}, ${sql.json(result as never)}, ${interpretation})
        RETURNING *
    `;

    return record;
}

export async function getUserRecords(
    userId: string,
    limit = 50
): Promise<DbDivinationRecord[]> {
    const sql = getDb();

    return sql<DbDivinationRecord[]>`
        SELECT * FROM divination_records
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit}
    `;
}

export async function deleteRecord(recordId: string): Promise<void> {
    const sql = getDb();
    await sql`DELETE FROM divination_records WHERE id = ${recordId}`;
}

// 统计操作
export async function getStats(): Promise<{
    totalUsers: number;
    totalDivinations: number;
    todayDivinations: number;
}> {
    const sql = getDb();

    const [userCount] = await sql<[{ count: string }]>`
        SELECT COUNT(*) as count FROM users
    `;

    const [totalCount] = await sql<[{ count: string }]>`
        SELECT COUNT(*) as count FROM divination_records
    `;

    const [todayCount] = await sql<[{ count: string }]>`
        SELECT COUNT(*) as count FROM divination_records
        WHERE created_at >= CURRENT_DATE
    `;

    return {
        totalUsers: parseInt(userCount.count, 10),
        totalDivinations: parseInt(totalCount.count, 10),
        todayDivinations: parseInt(todayCount.count, 10),
    };
}

// 管理员：获取所有记录
export async function getAllRecords(
    page = 1,
    pageSize = 20,
    search?: string
): Promise<{ records: DbDivinationRecord[]; total: number }> {
    const sql = getDb();
    const offset = (page - 1) * pageSize;

    let records: DbDivinationRecord[];
    let total: number;

    if (search) {
        const searchPattern = `%${search}%`;
        records = await sql<DbDivinationRecord[]>`
            SELECT * FROM divination_records
            WHERE question ILIKE ${searchPattern}
            ORDER BY created_at DESC
            LIMIT ${pageSize} OFFSET ${offset}
        `;
        const [countResult] = await sql<[{ count: string }]>`
            SELECT COUNT(*) as count FROM divination_records
            WHERE question ILIKE ${searchPattern}
        `;
        total = parseInt(countResult.count, 10);
    } else {
        records = await sql<DbDivinationRecord[]>`
            SELECT * FROM divination_records
            ORDER BY created_at DESC
            LIMIT ${pageSize} OFFSET ${offset}
        `;
        const [countResult] = await sql<[{ count: string }]>`
            SELECT COUNT(*) as count FROM divination_records
        `;
        total = parseInt(countResult.count, 10);
    }

    return { records, total };
}

// 设置操作
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
    const sql = getDb();

    const [setting] = await sql<DbSettings[]>`
        SELECT * FROM settings WHERE key = ${key}
    `;

    if (!setting) return defaultValue;

    let value = setting.value as T;

    // 处理可能的双重 JSON 编码（旧数据兼容）
    // 如果值是字符串且两端有引号，尝试解析
    if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
        try {
            value = JSON.parse(value) as T;
        } catch {
            // 解析失败则保持原值
        }
    }

    return value;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
    const sql = getDb();

    await sql`
        INSERT INTO settings (key, value, updated_at)
        VALUES (${key}, ${sql.json(value as never)}, NOW())
        ON CONFLICT (key) DO UPDATE SET
            value = EXCLUDED.value,
            updated_at = NOW()
    `;
}
