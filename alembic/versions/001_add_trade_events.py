"""add_trade_events_table

Revision ID: 001_add_trade_events
Revises: None
Create Date: 2026-07-20 07:47:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '001_add_trade_events'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create the trade_events table
    op.create_table(
        'trade_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_type', sa.String(), nullable=True),
        sa.Column('symbol', sa.String(), nullable=True),
        sa.Column('ticket', sa.Integer(), nullable=True),
        sa.Column('message', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    # Drop the table if rolling back
    op.drop_table('trade_events')
