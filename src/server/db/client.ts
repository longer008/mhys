import postgres from "postgres";
import {
    getDatabaseConfig,
    isDatabaseConfigured,
} from "@/server/config/env";

type GlobalWithDatabase = typeof globalThis & {
    __meihuaSql?: postgres.Sql;
};

const globalWithDatabase = globalThis as GlobalWithDatabase;

export { isDatabaseConfigured };

export function getDb(): postgres.Sql {
    const config = getDatabaseConfig();
    if (!config) {
        throw new Error("数据库未配置，请设置 DATABASE_URL");
    }

    if (!globalWithDatabase.__meihuaSql) {
        globalWithDatabase.__meihuaSql = postgres(config.connectionString, {
            ssl: "require",
            // Vercel 会横向扩展实例，单实例保持一个连接可避免连接数倍增。
            max: 1,
            idle_timeout: 20,
            connect_timeout: 10,
            // Supabase Transaction Pooler 不支持预处理语句。
            prepare: false,
            onnotice: () => undefined,
        });
    }

    return globalWithDatabase.__meihuaSql;
}

export async function checkDatabaseConnection(): Promise<boolean> {
    if (!isDatabaseConfigured()) return false;

    const sql = getDb();
    await sql`SELECT 1`;
    return true;
}
