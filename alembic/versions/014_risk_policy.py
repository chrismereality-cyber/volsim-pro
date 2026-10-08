"""create authoritative persistent risk policy

Revision ID: 014
Revises: 013
Create Date: 2026-10-08
"""

from alembic import op


revision = "014"
down_revision = "013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE public.risk_policy (
            id INTEGER PRIMARY KEY,

            max_daily_drawdown_percent NUMERIC(10, 4) NOT NULL,
            risk_per_trade_percent NUMERIC(10, 4) NOT NULL,
            max_position_size NUMERIC(10, 4) NOT NULL,

            liquidation_drawdown_percent NUMERIC(10, 4) NOT NULL,
            liquidation_margin_usage_percent NUMERIC(10, 4) NOT NULL,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            CONSTRAINT risk_policy_positive_values_check
                CHECK (
                    max_daily_drawdown_percent > 0
                    AND risk_per_trade_percent > 0
                    AND max_position_size > 0
                    AND liquidation_drawdown_percent > 0
                    AND liquidation_margin_usage_percent > 0
                ),

            CONSTRAINT risk_policy_liquidation_drawdown_check
                CHECK (
                    liquidation_drawdown_percent
                    > max_daily_drawdown_percent
                ),

            CONSTRAINT risk_policy_risk_per_trade_check
                CHECK (
                    risk_per_trade_percent
                    <= max_daily_drawdown_percent
                )
        )
        """
    )

    op.execute(
        """
        CREATE UNIQUE INDEX idx_risk_policy_singleton
            ON public.risk_policy ((true))
        """
    )

    op.execute(
        """
        INSERT INTO public.risk_policy (
            id,
            max_daily_drawdown_percent,
            risk_per_trade_percent,
            max_position_size,
            liquidation_drawdown_percent,
            liquidation_margin_usage_percent
        )
        VALUES (
            1,
            5.0,
            1.0,
            2.0,
            10.0,
            80.0
        )
        """
    )


def downgrade() -> None:
    op.execute(
        "DROP INDEX IF EXISTS public.idx_risk_policy_singleton"
    )

    op.execute(
        "DROP TABLE IF EXISTS public.risk_policy"
    )
