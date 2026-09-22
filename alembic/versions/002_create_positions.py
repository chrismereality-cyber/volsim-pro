"""create durable positions table

Revision ID: 002_create_positions
Revises: 001_add_trade_events
Create Date: 2026-08-18
"""

from alembic import op
import sqlalchemy as sa


revision = "002_create_positions"
down_revision = "001_add_trade_events"
branch_labels = None
depends_on = None


def upgrade():

    op.create_table(
        "positions",

        sa.Column(
            "id",
            sa.String(),
            nullable=False
        ),

        sa.Column(
            "trade_id",
            sa.String(),
            nullable=False
        ),

        sa.Column(
            "oms_order_id",
            sa.String(),
            nullable=True
        ),

        sa.Column(
            "symbol",
            sa.String(),
            nullable=False
        ),

        sa.Column(
            "side",
            sa.String(),
            nullable=False
        ),

        sa.Column(
            "volume",
            sa.Float(),
            nullable=False
        ),

        sa.Column(
            "open_price",
            sa.Float(),
            nullable=False
        ),

        sa.Column(
            "current_price",
            sa.Float(),
            nullable=False
        ),

        sa.Column(
            "floating_pl",
            sa.Float(),
            nullable=False,
            server_default="0"
        ),

        sa.Column(
            "realized_pl",
            sa.Float(),
            nullable=False,
            server_default="0"
        ),

        sa.Column(
            "status",
            sa.String(),
            nullable=False,
            server_default="OPEN"
        ),

        sa.Column(
            "execution_mode",
            sa.String(),
            nullable=False,
            server_default="PAPER"
        ),

        sa.Column(
            "broker_order_ticket",
            sa.BigInteger(),
            nullable=True
        ),

        sa.Column(
            "broker_deal_ticket",
            sa.BigInteger(),
            nullable=True
        ),

        sa.Column(
            "broker_position_ticket",
            sa.BigInteger(),
            nullable=True
        ),

        sa.Column(
            "opened_at",
            sa.DateTime(),
            nullable=True
        ),

        sa.Column(
            "closed_at",
            sa.DateTime(),
            nullable=True
        ),

        sa.Column(
            "close_price",
            sa.Float(),
            nullable=True
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.func.now(),
            nullable=False
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(),
            server_default=sa.func.now(),
            nullable=False
        ),

        sa.PrimaryKeyConstraint("id"),

        sa.UniqueConstraint(
            "trade_id",
            name="uq_positions_trade_id"
        )
    )

    op.create_index(
        "idx_positions_status",
        "positions",
        ["status"]
    )

    op.create_index(
        "idx_positions_symbol",
        "positions",
        ["symbol"]
    )

    op.create_index(
        "idx_positions_execution_mode",
        "positions",
        ["execution_mode"]
    )

    op.create_index(
        "idx_positions_updated_at",
        "positions",
        ["updated_at"]
    )


def downgrade():

    op.drop_index(
        "idx_positions_updated_at",
        table_name="positions"
    )

    op.drop_index(
        "idx_positions_execution_mode",
        table_name="positions"
    )

    op.drop_index(
        "idx_positions_symbol",
        table_name="positions"
    )

    op.drop_index(
        "idx_positions_status",
        table_name="positions"
    )

    op.drop_table("positions")
