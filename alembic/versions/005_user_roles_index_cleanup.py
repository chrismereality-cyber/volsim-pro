"""remove redundant user_roles user_id index

Revision ID: 005_user_roles_index_cleanup
Revises: 004_auth_email_index_cleanup
Create Date: 2026-09-01
"""

from typing import Sequence, Union

from alembic import op


revision: str = "005_user_roles_index_cleanup"
down_revision: Union[str, Sequence[str], None] = "004_auth_email_index_cleanup"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_index(
        "ix_user_roles_user_id",
        table_name="user_roles",
    )


def downgrade() -> None:
    op.create_index(
        "ix_user_roles_user_id",
        "user_roles",
        ["user_id"],
        unique=False,
    )
