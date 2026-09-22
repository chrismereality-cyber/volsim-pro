"""add authentication identity rbac

Revision ID: 003_authentication_identity_rbac
Revises: 002_create_positions
Create Date: 2026-08-31
"""

from alembic import op
import sqlalchemy as sa


revision = "003_authentication_identity_rbac"
down_revision = "002_create_positions"
branch_labels = None
depends_on = None


def upgrade():

    # ------------------------------------------------------------------
    # Roles
    # ------------------------------------------------------------------

    op.create_table(
        "roles",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            nullable=False,
        ),

        sa.Column(
            "name",
            sa.String(64),
            nullable=False,
        ),

        sa.Column(
            "description",
            sa.Text(),
            nullable=True,
        ),

        sa.UniqueConstraint(
            "name",
            name="uq_roles_name",
        ),
    )


    # ------------------------------------------------------------------
    # Users
    # ------------------------------------------------------------------

    op.create_table(
        "users",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            nullable=False,
        ),

        sa.Column(
            "email",
            sa.String(320),
            nullable=False,
        ),

        sa.Column(
            "password_hash",
            sa.String(255),
            nullable=False,
        ),

        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),

        sa.Column(
            "is_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),

        sa.UniqueConstraint(
            "email",
            name="uq_users_email",
        ),
    )

    op.create_index(
        "ix_users_email",
        "users",
        ["email"],
        unique=False,
    )


    # ------------------------------------------------------------------
    # User Roles
    # ------------------------------------------------------------------

    op.create_table(
        "user_roles",

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
            "role_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),

        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),

        sa.ForeignKeyConstraint(
            ["role_id"],
            ["roles.id"],
            ondelete="CASCADE",
        ),

        sa.UniqueConstraint(
            "user_id",
            "role_id",
            name="uq_user_role",
        ),
    )

    op.create_index(
        "ix_user_roles_user_id",
        "user_roles",
        ["user_id"],
        unique=False,
    )


    # ------------------------------------------------------------------
    # Authentication Sessions
    # ------------------------------------------------------------------

    op.create_table(
        "auth_sessions",

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
            "refresh_token_hash",
            sa.String(255),
            nullable=False,
        ),

        sa.Column(
            "expires_at",
            sa.DateTime(),
            nullable=False,
        ),

        sa.Column(
            "revoked_at",
            sa.DateTime(),
            nullable=True,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),

        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),

        sa.UniqueConstraint(
            "refresh_token_hash",
        ),
    )

    op.create_index(
        "ix_auth_sessions_user_id",
        "auth_sessions",
        ["user_id"],
        unique=False,
    )


    # ------------------------------------------------------------------
    # Security Audit Events
    # ------------------------------------------------------------------

    op.create_table(
        "audit_events",

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
            nullable=True,
        ),

        sa.Column(
            "event_type",
            sa.String(128),
            nullable=False,
        ),

        sa.Column(
            "action",
            sa.String(128),
            nullable=False,
        ),

        sa.Column(
            "resource",
            sa.String(255),
            nullable=True,
        ),

        sa.Column(
            "details",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),

        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
    )

    op.create_index(
        "ix_audit_events_user_id",
        "audit_events",
        ["user_id"],
        unique=False,
    )

    op.create_index(
        "ix_audit_events_event_type",
        "audit_events",
        ["event_type"],
        unique=False,
    )


def downgrade():

    op.drop_index(
        "ix_audit_events_event_type",
        table_name="audit_events",
    )

    op.drop_index(
        "ix_audit_events_user_id",
        table_name="audit_events",
    )

    op.drop_table("audit_events")


    op.drop_index(
        "ix_auth_sessions_user_id",
        table_name="auth_sessions",
    )

    op.drop_table("auth_sessions")


    op.drop_index(
        "ix_user_roles_user_id",
        table_name="user_roles",
    )

    op.drop_table("user_roles")


    op.drop_index(
        "ix_users_email",
        table_name="users",
    )

    op.drop_table("users")


    op.drop_table("roles")
