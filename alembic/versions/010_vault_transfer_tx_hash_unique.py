"""add vault transfer tx hash uniqueness

Revision ID: 010
Revises: 009
Create Date: 2026-09-09 07:00:00.000000
"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '010'
down_revision = '009'

def upgrade():
    # A blockchain transaction hash must identify at most one durable
    # vault transfer. Keep tx_hash nullable for records that do not yet
    # have a blockchain transaction hash, while enforcing uniqueness for
    # every real transaction hash.
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_vault_transfer_tx_hash "
        "ON public.vault_transfer(tx_hash) "
        "WHERE tx_hash IS NOT NULL;"
    )

def downgrade():
    op.execute(
        "DROP INDEX IF EXISTS public.uq_vault_transfer_tx_hash;"
    )
