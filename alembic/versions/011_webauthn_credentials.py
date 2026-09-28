"""create webauthn credentials

Revision ID: 011
Revises: 010
Create Date: 2026-09-26
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "011"
down_revision = "010"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "webauthn_credentials",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            autoincrement=True,
            nullable=False,
        ),

        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "credential_id",
            sa.Text(),
            nullable=False,
        ),

        sa.Column(
            "credential_public_key",
            sa.Text(),
            nullable=False,
        ),

        sa.Column(
            "sign_count",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),

        sa.Column(
            "aaguid",
            sa.String(36),
            nullable=True,
        ),

        sa.Column(
            "fmt",
            sa.String(64),
            nullable=True,
        ),

        sa.Column(
            "credential_type",
            sa.String(64),
            nullable=True,
        ),

        sa.Column(
            "user_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),

        sa.Column(
            "credential_device_type",
            sa.String(64),
            nullable=True,
        ),

        sa.Column(
            "credential_backed_up",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),

        sa.Column(
            "attestation_object",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),

        sa.Column(
            "last_used_at",
            sa.DateTime(),
            nullable=True,
        ),

        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),

        sa.UniqueConstraint(
            "credential_id",
            name="uq_webauthn_credentials_credential_id",
        ),
    )

    op.create_index(
        "ix_webauthn_credentials_user_id",
        "webauthn_credentials",
        ["user_id"],
        unique=False,
    )


def downgrade():
    op.drop_index(
        "ix_webauthn_credentials_user_id",
        table_name="webauthn_credentials",
    )

    op.drop_table("webauthn_credentials")
