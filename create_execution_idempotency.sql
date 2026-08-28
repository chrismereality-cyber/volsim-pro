CREATE TABLE IF NOT EXISTS execution_idempotency (
    client_order_id TEXT PRIMARY KEY,

    oms_order_id UUID NULL,

    execution_mode VARCHAR(16) NOT NULL,

    status VARCHAR(32) NOT NULL,

    broker_order_ticket BIGINT NULL,

    broker_deal_ticket BIGINT NULL,

    broker_position_ticket BIGINT NULL,

    retcode VARCHAR(64) NULL,

    result JSONB NULL,

    created_at TIMESTAMP WITHOUT TIME ZONE
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMP WITHOUT TIME ZONE
        NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_execution_idempotency_oms_order
ON execution_idempotency (oms_order_id);

CREATE INDEX IF NOT EXISTS idx_execution_idempotency_status
ON execution_idempotency (status);

CREATE INDEX IF NOT EXISTS idx_execution_idempotency_broker_order
ON execution_idempotency (broker_order_ticket);

CREATE INDEX IF NOT EXISTS idx_execution_idempotency_broker_deal
ON execution_idempotency (broker_deal_ticket);
