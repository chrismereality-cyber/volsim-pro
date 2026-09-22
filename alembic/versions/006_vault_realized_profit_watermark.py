"""Add durable realized profit watermark to immutable vault state.

Revision ID: 006_vault_profit_watermark
Revises: 005_user_roles_index_cleanup
Create Date: 2026-09-02

This migration adds the durable cumulative realized-profit watermark
required by VaultService.register_profit().

The value is stored on immutable_vault_state so the allocation watermark
survives application restarts and prevents duplicate 70/30 allocations.

No existing allocation data is modified.
No trading tables are modified.
"""

from alembic import op
import sqlalchemy as sa


revision = "006_vault_profit_watermark"
down_revision = "005_user_roles_index_cleanup"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "immutable_vault_state",
        sa.Column(
            "last_realized_profit",
            sa.Numeric(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        schema="public",
    )


def downgrade() -> None:
    op.drop_column(
        "immutable_vault_state",
        "last_realized_profit",
        schema="public",
    )