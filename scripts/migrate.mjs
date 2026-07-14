#!/usr/bin/env node

/**
 * 增量数据库迁移执行器。
 *
 * 必须通过 DIRECT_DATABASE_URL 使用 Session Pooler 或 Direct Connection，
 * 禁止在 Vercel 构建阶段自动执行。
 */

import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const connectionString = process.env.DIRECT_DATABASE_URL;
if (!connectionString) {
    throw new Error("缺少 DIRECT_DATABASE_URL，拒绝执行数据库迁移");
}

const currentFile = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(currentFile), "..");
const migrationsDirectory = path.join(projectRoot, "db", "migrations");

const sql = postgres(connectionString, {
    ssl: "require",
    max: 1,
    prepare: false,
    connect_timeout: 10,
});

async function run() {
    await sql`SELECT pg_advisory_lock(hashtext('meihua-yishu-migrations'))`;

    try {
        await sql`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version TEXT PRIMARY KEY,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `;

        const files = (await readdir(migrationsDirectory))
            .filter((file) => file.endsWith(".sql"))
            .sort();

        const appliedRows = await sql`SELECT version FROM schema_migrations`;
        const applied = new Set(appliedRows.map((row) => row.version));

        for (const file of files) {
            if (applied.has(file)) {
                console.log(`跳过已执行迁移：${file}`);
                continue;
            }

            const migrationPath = path.join(migrationsDirectory, file);
            console.log(`执行迁移：${file}`);

            await sql.begin(async (transaction) => {
                await transaction.file(migrationPath, { cache: false });
                await transaction`
                    INSERT INTO schema_migrations (version)
                    VALUES (${file})
                `;
            });
        }

        console.log("数据库迁移完成");
    } finally {
        await sql`SELECT pg_advisory_unlock(hashtext('meihua-yishu-migrations'))`;
        await sql.end({ timeout: 5 });
    }
}

run().catch((error) => {
    console.error("数据库迁移失败：", error);
    process.exitCode = 1;
});
