import { getDb } from "@/server/db/client";

export interface StoredSettingEntry {
    key: string;
    value: unknown;
    updatedAt: Date;
}

interface StoredSettingRow {
    key: string;
    value: unknown;
    updated_at: Date;
}

export async function getStoredSettings(
    keys: readonly string[]
): Promise<Map<string, StoredSettingEntry>> {
    if (keys.length === 0) return new Map();

    const sql = getDb();
    const rows = await sql<StoredSettingRow[]>`
        SELECT key, value, updated_at
        FROM settings
        WHERE key IN ${sql(keys)}
    `;

    return new Map(
        rows.map((row) => [
            row.key,
            {
                key: row.key,
                value: row.value,
                updatedAt: row.updated_at,
            },
        ])
    );
}

export async function setStoredSetting(
    key: string,
    value: unknown
): Promise<void> {
    const sql = getDb();
    await sql`
        INSERT INTO settings (key, value, updated_at)
        VALUES (${key}, ${sql.json(value as never)}, NOW())
        ON CONFLICT (key) DO UPDATE SET
            value = EXCLUDED.value,
            updated_at = NOW()
    `;
}

export async function deleteStoredSetting(key: string): Promise<void> {
    const sql = getDb();
    await sql`DELETE FROM settings WHERE key = ${key}`;
}
