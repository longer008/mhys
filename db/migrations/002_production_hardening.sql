-- 为幂等请求、AI 调用状态和运行审计增加字段。

ALTER TABLE divination_records
    ADD COLUMN IF NOT EXISTS client_request_id UUID,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed',
    ADD COLUMN IF NOT EXISTS input JSONB,
    ADD COLUMN IF NOT EXISTS provider TEXT,
    ADD COLUMN IF NOT EXISTS model TEXT,
    ADD COLUMN IF NOT EXISTS latency_ms INTEGER,
    ADD COLUMN IF NOT EXISTS input_tokens INTEGER,
    ADD COLUMN IF NOT EXISTS output_tokens INTEGER,
    ADD COLUMN IF NOT EXISTS error_code TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'divination_records_status_check'
    ) THEN
        ALTER TABLE divination_records
            ADD CONSTRAINT divination_records_status_check
            CHECK (status IN ('pending', 'completed', 'failed'));
    END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_records_user_request
    ON divination_records(user_id, client_request_id)
    WHERE client_request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_records_user_created_at
    ON divination_records(user_id, created_at DESC);

-- 固定窗口限流计数。key_hash 只保存经过 HMAC 的标识，不保存原始 IP。
CREATE TABLE IF NOT EXISTS rate_limit_counters (
    scope TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    window_started_at TIMESTAMPTZ NOT NULL,
    window_seconds INTEGER NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (scope, key_hash)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_updated_at
    ON rate_limit_counters(updated_at);
