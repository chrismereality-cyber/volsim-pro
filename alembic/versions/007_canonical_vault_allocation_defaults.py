"""Canonicalize immutable vault allocation defaults.

Revision ID: 007_vault_allocation_defaults
Revises: 006_vault_profit_watermark
Create Date: 2026-09-02

This migration hardens the pre-existing immutable_vault_state schema so
new rows cannot silently fall back to the retired 50/50 allocation policy.

Existing balances and ledger history are intentionally unchanged.
"""

from alembic import op


revision = "007_vault_allocation_defaults"
down_revision = "006_vault_profit_watermark"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE public.immutable_vault_state
        ALTER COLUMN allocation_profile
        SET DEFAULT 'CORE_SATELLITE_70_30'
        """
    )

    op.execute(
        """
        ALTER TABLE public.immutable_vault_state
        ALTER COLUMN equity_percentage
        SET DEFAULT 70.00
        """
    )

    op.execute(
        """
        ALTER TABLE public.immutable_vault_state
        ALTER COLUMN vault_percentage
        SET DEFAULT 30.00
        """
    )


def downgrade() -> None:
    op.execute(
        """
        ALTER TABLE public.immutable_vault_state
        ALTER COLUMN allocation_profile
        DROP DEFAULT
        """
    )

    op.execute(
        """
        ALTER TABLE public.immutable_vault_state
        ALTER COLUMN equity_percentage
        DROP DEFAULT
        """
    )

    op.execute(
        """
        ALTER TABLE public.immutable_vault_state
        ALTER COLUMN vault_percentage
        DROP DEFAULT
        """
    )
