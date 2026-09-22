"""vault singleton constraint

Revision ID: 009
Revises: 008
Create Date: 2026-09-08 17:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '009'
down_revision = '008_capital_treasury'

def upgrade():
    # Enforce a strict single-row invariant using a unique index on a constant expression
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_immutable_vault_state_singleton "
        "ON public.immutable_vault_state ((true));"
    )

def downgrade():
    op.execute("DROP INDEX IF EXISTS public.idx_immutable_vault_state_singleton;")
