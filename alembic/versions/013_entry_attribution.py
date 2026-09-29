"""add durable AI entry attribution

Revision ID: 013
Revises: 012
Create Date: 2026-09-29
"""

from alembic import op
import sqlalchemy as sa


revision = "013"
down_revision = "012"
branch_labels = None
depends_on = None


def upgrade():

    op.create_table(
        "entry_attribution",

        sa.Column(
            "trade_id",
            sa.String(),
            nullable=False,
        ),

        sa.Column(
            "decision_id",
            sa.String(),
            nullable=True,
        ),

        sa.Column(
            "symbol",
            sa.String(),
            nullable=False,
        ),

        sa.Column(
            "side",
            sa.String(),
            nullable=False,
        ),

        sa.Column(
            "trend",
            sa.String(),
            nullable=True,
        ),

        sa.Column(
            "regime",
            sa.String(),
            nullable=True,
        ),

        sa.Column(
            "volatility",
            sa.String(),
            nullable=True,
        ),

        sa.Column(
            "confidence",
            sa.Float(),
            nullable=True,
        ),

        sa.Column(
            "atr",
            sa.Float(),
            nullable=True,
        ),

        sa.Column(
            "rsi",
            sa.Float(),
            nullable=True,
        ),

        sa.Column(
            "ema20",
            sa.Float(),
            nullable=True,
        ),

        sa.Column(
            "ema50",
            sa.Float(),
            nullable=True,
        ),

        sa.Column(
            "ema200",
            sa.Float(),
            nullable=True,
        ),

        sa.Column(
            "spread",
            sa.Float(),
            nullable=True,
        ),

        sa.Column(
            "entry_timestamp",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),

        sa.PrimaryKeyConstraint("trade_id"),
    )

    op.create_index(
        "idx_entry_attribution_symbol",
        "entry_attribution",
        ["symbol"],
    )

    op.create_index(
        "idx_entry_attribution_decision_id",
        "entry_attribution",
        ["decision_id"],
    )

    op.create_index(
        "idx_entry_attribution_entry_timestamp",
        "entry_attribution",
        ["entry_timestamp"],
    )


def downgrade():

    op.drop_index(
        "idx_entry_attribution_entry_timestamp",
        table_name="entry_attribution",
    )

    op.drop_index(
        "idx_entry_attribution_decision_id",
        table_name="entry_attribution",
    )

    op.drop_index(
        "idx_entry_attribution_symbol",
        table_name="entry_attribution",
    )

    op.drop_table("entry_attribution")
