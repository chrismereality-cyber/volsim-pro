from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from auth_models import Role, User, UserRole
from database import get_db
from src.auth.dependencies import permission_guard
from src.auth.models import AuthorizationContext


router = APIRouter(
    prefix="/admin",
    tags=["admin"],
)


# ---------------------------------------------------------------------------
# Request / Response Contracts
# ---------------------------------------------------------------------------

class UserStatusRequest(BaseModel):
    is_active: bool


class UserRolesRequest(BaseModel):
    roles: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Administrative Summary
# ---------------------------------------------------------------------------

@router.get("/summary")
def get_admin_summary(
    context: AuthorizationContext = Depends(
        permission_guard("users.read")
    ),
    db: Session = Depends(get_db),
):
    """
    Read-only administrative summary.

    Access is controlled by the canonical RBAC permission:
        users.read

    No password hashes or authentication secrets are returned.
    """

    user_count = db.scalar(
        select(func.count(User.id))
    ) or 0

    active_user_count = db.scalar(
        select(func.count(User.id)).where(
            User.is_active.is_(True)
        )
    ) or 0

    role_count = db.scalar(
        select(func.count(Role.id))
    ) or 0

    assignment_count = db.scalar(
        select(func.count(UserRole.id))
    ) or 0

    return {
        "status": "ONLINE",
        "administrator": {
            "user_id": context.identity.user_id,
            "username": context.identity.username,
            "roles": sorted(context.identity.roles),
            "permissions": sorted(context.identity.permissions),
        },
        "statistics": {
            "users": int(user_count),
            "active_users": int(active_user_count),
            "roles": int(role_count),
            "role_assignments": int(assignment_count),
        },
    }


# ---------------------------------------------------------------------------
# User Management — Read
# ---------------------------------------------------------------------------

@router.get("/users")
def list_admin_users(
    context: AuthorizationContext = Depends(
        permission_guard("users.read")
    ),
    db: Session = Depends(get_db),
):
    """
    Return the administrative user directory.

    Password hashes and authentication secrets are never returned.
    """

    users = db.execute(
        select(User).order_by(User.id.asc())
    ).scalars().all()

    result = []

    for user in users:
        roles = db.execute(
            select(Role.name)
            .join(
                UserRole,
                UserRole.role_id == Role.id,
            )
            .where(
                UserRole.user_id == user.id
            )
            .order_by(Role.name.asc())
        ).scalars().all()

        result.append({
            "id": user.id,
            "email": user.email,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "roles": list(roles),
            "created_at": user.created_at.isoformat()
            if user.created_at else None,
            "updated_at": user.updated_at.isoformat()
            if user.updated_at else None,
        })

    return {
        "status": "ONLINE",
        "count": len(result),
        "users": result,
    }


@router.get("/users/{user_id}")
def get_admin_user(
    user_id: int,
    context: AuthorizationContext = Depends(
        permission_guard("users.read")
    ),
    db: Session = Depends(get_db),
):
    """
    Return one administrative user record.

    Password hashes and authentication secrets are never returned.
    """

    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    roles = db.execute(
        select(Role.name)
        .join(
            UserRole,
            UserRole.role_id == Role.id,
        )
        .where(
            UserRole.user_id == user.id
        )
        .order_by(Role.name.asc())
    ).scalars().all()

    return {
        "status": "ONLINE",
        "user": {
            "id": user.id,
            "email": user.email,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "roles": list(roles),
            "created_at": user.created_at.isoformat()
            if user.created_at else None,
            "updated_at": user.updated_at.isoformat()
            if user.updated_at else None,
        },
    }


# ---------------------------------------------------------------------------
# User Management — Account Status
# ---------------------------------------------------------------------------

@router.patch("/users/{user_id}/status")
def update_admin_user_status(
    user_id: int,
    payload: UserStatusRequest,
    context: AuthorizationContext = Depends(
        permission_guard("users.manage")
    ),
    db: Session = Depends(get_db),
):
    """
    Activate or deactivate a user.

    Protected server-side by:
        users.manage

    An administrator cannot deactivate their own account through this
    endpoint, preventing accidental self-lockout.
    """

    if str(user_id) == str(context.identity.user_id):
        if not payload.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Administrators cannot deactivate their own account.",
            )

    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    user.is_active = payload.is_active

    db.commit()
    db.refresh(user)

    return {
        "status": "ONLINE",
        "message": "User status updated.",
        "user": {
            "id": user.id,
            "email": user.email,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
        },
    }


# ---------------------------------------------------------------------------
# User Management — Role Assignment
# ---------------------------------------------------------------------------

@router.put("/users/{user_id}/roles")
def replace_admin_user_roles(
    user_id: int,
    payload: UserRolesRequest,
    context: AuthorizationContext = Depends(
        permission_guard("users.manage")
    ),
    db: Session = Depends(get_db),
):
    """
    Replace the complete role set for a user.

    Protected server-side by:
        users.manage

    Role names must already exist in the canonical roles table.
    """

    if str(user_id) == str(context.identity.user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot modify their own roles through this endpoint.",
        )

    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    requested_roles = sorted({
        role.strip()
        for role in payload.roles
        if role and role.strip()
    })

    if not requested_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one role is required.",
        )

    # Privileged-role boundary:
    # ordinary administrators may manage standard user/trader roles,
    # while only a superadmin may grant admin or superadmin authority.
    caller_is_superadmin = (
        "*" in context.identity.permissions
        or "superadmin" in context.identity.roles
    )

    privileged_roles = {
        "admin",
        "superadmin",
    }

    if (
        not caller_is_superadmin
        and any(role in privileged_roles for role in requested_roles)
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Only superadmin identities may assign "
                "admin or superadmin roles."
            ),
        )

    roles = db.execute(
        select(Role).where(
            Role.name.in_(requested_roles)
        )
    ).scalars().all()

    found_roles = {role.name for role in roles}
    missing_roles = [
        role
        for role in requested_roles
        if role not in found_roles
    ]

    if missing_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "One or more requested roles do not exist.",
                "missing_roles": missing_roles,
            },
        )

    db.execute(
        UserRole.__table__.delete().where(
            UserRole.user_id == user.id
        )
    )

    for role in roles:
        db.add(
            UserRole(
                user_id=user.id,
                role_id=role.id,
            )
        )

    db.commit()

    final_roles = db.execute(
        select(Role.name)
        .join(
            UserRole,
            UserRole.role_id == Role.id,
        )
        .where(
            UserRole.user_id == user.id
        )
        .order_by(Role.name.asc())
    ).scalars().all()

    return {
        "status": "ONLINE",
        "message": "User roles updated.",
        "user": {
            "id": user.id,
            "email": user.email,
            "roles": list(final_roles),
        },
    }

