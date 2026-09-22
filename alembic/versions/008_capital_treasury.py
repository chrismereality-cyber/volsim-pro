"""Introduce institutional capital and treasury accounting.

Revision ID: 008_capital_treasury
Revises: 007_vault_allocation_defaults
Create Date: 2026-09-08

Introduces the institutional capital-movement subsystem.

This domain is intentionally separate from:
- immutable_vault_state / vault_ledger / vault_transfer
- legacy wallet_accounts / wallet_ledger
- trading execution ledgers

capital_movements represent business-level movement requests.
capital_movement_entries represent double-entry accounting.
capital_approvals represent authorization and separation of duties.
capital_settlements represent external execution/reconciliation.

No financial balances are bootstrapped by this migration.
"""

from alembic import op


revision = "008_capital_treasury"
down_revision = "007_vault_allocation_defaults"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE public.capital_accounts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

            account_code VARCHAR(64) NOT NULL UNIQUE,
            account_type VARCHAR(32) NOT NULL,

            currency VARCHAR(3) NOT NULL DEFAULT 'USD',

            balance NUMERIC(24, 8) NOT NULL DEFAULT 0,
            reserved_balance NUMERIC(24, 8) NOT NULL DEFAULT 0,

            is_active BOOLEAN NOT NULL DEFAULT TRUE,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            CONSTRAINT capital_accounts_type_check
                CHECK (
                    account_type IN (
                        'TRADING_EQUITY',
                        'IMMUTABLE_VAULT',
                        'EXTERNAL_BANK'
                    )
                ),

            CONSTRAINT capital_accounts_currency_check
                CHECK (currency ~ '^[A-Z]{3}$'),

            CONSTRAINT capital_accounts_balance_check
                CHECK (balance >= 0),

            CONSTRAINT capital_accounts_reserved_check
                CHECK (reserved_balance >= 0),

            CONSTRAINT capital_accounts_reserve_limit_check
                CHECK (reserved_balance <= balance)
        )
        """
    )

    op.execute(
        """
        CREATE TABLE public.capital_movements (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

            movement_reference VARCHAR(80) NOT NULL UNIQUE,
            idempotency_key VARCHAR(128) NOT NULL UNIQUE,

            movement_type VARCHAR(32) NOT NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'REQUESTED',

            amount NUMERIC(24, 8) NOT NULL,
            currency VARCHAR(3) NOT NULL DEFAULT 'USD',

            source_account_id UUID NOT NULL
                REFERENCES public.capital_accounts(id)
                ON DELETE RESTRICT,

            destination_account_id UUID NOT NULL
                REFERENCES public.capital_accounts(id)
                ON DELETE RESTRICT,

            requested_by INTEGER NOT NULL
                REFERENCES public.users(id)
                ON DELETE RESTRICT,

            reason TEXT,

            external_reference VARCHAR(128),

            requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            approved_at TIMESTAMPTZ,
            executing_at TIMESTAMPTZ,
            settled_at TIMESTAMPTZ,
            reconciled_at TIMESTAMPTZ,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            CONSTRAINT capital_movements_type_check
                CHECK (
                    movement_type IN (
                        'EQUITY_TO_VAULT',
                        'VAULT_TO_EQUITY',
                        'EQUITY_TO_BANK',
                        'VAULT_TO_BANK',
                        'BANK_TO_EQUITY',
                        'BANK_TO_VAULT'
                    )
                ),

            CONSTRAINT capital_movements_status_check
                CHECK (
                    status IN (
                        'REQUESTED',
                        'VALIDATED',
                        'PENDING_APPROVAL',
                        'APPROVED',
                        'EXECUTING',
                        'SETTLED',
                        'RECONCILED',
                        'REJECTED',
                        'CANCELLED',
                        'FAILED',
                        'REVERSED'
                    )
                ),

            CONSTRAINT capital_movements_amount_check
                CHECK (amount > 0),

            CONSTRAINT capital_movements_currency_check
                CHECK (currency ~ '^[A-Z]{3}$'),

            CONSTRAINT capital_movements_accounts_distinct_check
                CHECK (source_account_id <> destination_account_id)
        )
        """
    )

    op.execute(
        """
        CREATE TABLE public.capital_movement_entries (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

            movement_id UUID NOT NULL
                REFERENCES public.capital_movements(id)
                ON DELETE RESTRICT,

            account_id UUID NOT NULL
                REFERENCES public.capital_accounts(id)
                ON DELETE RESTRICT,

            entry_type VARCHAR(6) NOT NULL,

            amount NUMERIC(24, 8) NOT NULL,
            currency VARCHAR(3) NOT NULL DEFAULT 'USD',

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            CONSTRAINT capital_entries_type_check
                CHECK (entry_type IN ('DEBIT', 'CREDIT')),

            CONSTRAINT capital_entries_amount_check
                CHECK (amount > 0),

            CONSTRAINT capital_entries_currency_check
                CHECK (currency ~ '^[A-Z]{3}$'),

            CONSTRAINT capital_entries_movement_account_direction_unique
                UNIQUE (movement_id, account_id, entry_type)
        )
        """
    )

    op.execute(
        """
        CREATE TABLE public.capital_approvals (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

            movement_id UUID NOT NULL
                REFERENCES public.capital_movements(id)
                ON DELETE RESTRICT,

            approver_user_id INTEGER NOT NULL
                REFERENCES public.users(id)
                ON DELETE RESTRICT,

            decision VARCHAR(16) NOT NULL,

            reason TEXT,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            CONSTRAINT capital_approvals_decision_check
                CHECK (
                    decision IN (
                        'APPROVED',
                        'REJECTED'
                    )
                ),

            CONSTRAINT capital_approvals_movement_approver_unique
                UNIQUE (movement_id, approver_user_id)
        )
        """
    )

    op.execute(
        """
        CREATE TABLE public.capital_settlements (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

            movement_id UUID NOT NULL UNIQUE
                REFERENCES public.capital_movements(id)
                ON DELETE RESTRICT,

            settlement_reference VARCHAR(128) NOT NULL UNIQUE,

            settlement_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',

            external_reference VARCHAR(128),

            external_account_reference VARCHAR(256),

            amount NUMERIC(24, 8) NOT NULL,
            currency VARCHAR(3) NOT NULL DEFAULT 'USD',

            blockchain_network VARCHAR(64),
            tx_hash VARCHAR(256),

            confirmation_count INTEGER NOT NULL DEFAULT 0,

            failure_reason TEXT,

            initiated_at TIMESTAMPTZ,
            settled_at TIMESTAMPTZ,
            reconciled_at TIMESTAMPTZ,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            CONSTRAINT capital_settlements_status_check
                CHECK (
                    settlement_status IN (
                        'PENDING',
                        'EXECUTING',
                        'SETTLED',
                        'RECONCILED',
                        'FAILED',
                        'REVERSED'
                    )
                ),

            CONSTRAINT capital_settlements_amount_check
                CHECK (amount > 0),

            CONSTRAINT capital_settlements_currency_check
                CHECK (currency ~ '^[A-Z]{3}$'),

            CONSTRAINT capital_settlements_confirmation_check
                CHECK (confirmation_count >= 0)
        )
        """
    )

    op.execute(
        """
        CREATE UNIQUE INDEX uq_capital_settlements_tx_hash
            ON public.capital_settlements(tx_hash)
            WHERE tx_hash IS NOT NULL
        """
    )

    op.execute(
        """
        CREATE INDEX idx_capital_movements_status
            ON public.capital_movements(status)
        """
    )

    op.execute(
        """
        CREATE INDEX idx_capital_movements_requested_by
            ON public.capital_movements(requested_by)
        """
    )

    op.execute(
        """
        CREATE INDEX idx_capital_movements_created_at
            ON public.capital_movements(created_at)
        """
    )

    op.execute(
        """
        CREATE INDEX idx_capital_movements_source_account
            ON public.capital_movements(source_account_id)
        """
    )

    op.execute(
        """
        CREATE INDEX idx_capital_movements_destination_account
            ON public.capital_movements(destination_account_id)
        """
    )

    op.execute(
        """
        CREATE INDEX idx_capital_entries_movement
            ON public.capital_movement_entries(movement_id)
        """
    )

    op.execute(
        """
        CREATE INDEX idx_capital_entries_account
            ON public.capital_movement_entries(account_id)
        """
    )

    op.execute(
        """
        CREATE INDEX idx_capital_approvals_movement
            ON public.capital_approvals(movement_id)
        """
    )

    op.execute(
        """
        CREATE INDEX idx_capital_approvals_approver
            ON public.capital_approvals(approver_user_id)
        """
    )

    op.execute(
        """
        CREATE INDEX idx_capital_settlements_status
            ON public.capital_settlements(settlement_status)
        """
    )


def downgrade() -> None:
    op.execute(
        "DROP TABLE IF EXISTS public.capital_settlements"
    )

    op.execute(
        "DROP TABLE IF EXISTS public.capital_approvals"
    )

    op.execute(
        "DROP TABLE IF EXISTS public.capital_movement_entries"
    )

    op.execute(
        "DROP TABLE IF EXISTS public.capital_movements"
    )

    op.execute(
        "DROP TABLE IF EXISTS public.capital_accounts"
    )
