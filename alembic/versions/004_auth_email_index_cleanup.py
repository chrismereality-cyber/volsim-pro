"""remove redundant users email index

Revision ID: 004_auth_email_index_cleanup
Revises: 003_authentication_identity_rbac
Create Date: 2026-09-01
"""

from alembic import op


revision = "004_auth_email_index_cleanup"
down_revision = "003_authentication_identity_rbac"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_index(
        "ix_users_email",
        table_name="users",
    )


def downgrade():
    op.create_index(
        "ix_users_email",
        "users",
        ["email"],
        unique=False,
    )
