"""add WebAuthn challenge storage

Revision ID: 012
Revises: 011
Create Date: 2026-09-26 13:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "012"
down_revision = "011"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "webauthn_challenges",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "challenge",
            sa.Text(),
            nullable=False,
        ),
        sa.Column(
            "ceremony",
            sa.String(length=32),
            nullable=False,
        ),
        sa.Column(
            "expires_at",
            sa.DateTime(),
            nullable=False,
        ),
        sa.Column(
            "used_at",
            sa.DateTime(),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint(
            "challenge",
            name="uq_webauthn_challenges_challenge",
        ),
    )

    op.create_index(
        "ix_webauthn_challenges_user_id",
        "webauthn_challenges",
        ["user_id"],
        unique=False,
    )

    op.create_index(
        "ix_webauthn_challenges_expires_at",
        "webauthn_challenges",
        ["expires_at"],
        unique=False,
    )


def downgrade():
    op.drop_index(
        "ix_webauthn_challenges_expires_at",
        table_name="webauthn_challenges",
    )
    op.drop_index(
        "ix_webauthn_challenges_user_id",
        table_name="webauthn_challenges",
    )
    op.drop_table("webauthn_challenges")
