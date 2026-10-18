from .models import AuthorizationContext, Identity
from .rbac import permissions_for_roles
from .repository import AuthRepository


class IdentityService:
    """Builds normalized identities from trusted authentication data."""

    @staticmethod
    def from_access_token_payload(db, payload: dict) -> Identity:
        """Resolve token identity using current database account state."""

        if not isinstance(payload, dict):
            raise ValueError("Invalid access-token payload.")

        user_id = payload.get("sub")

        if not user_id or isinstance(user_id, bool):
            raise ValueError("Access token is missing subject.")

        try:
            database_user_id = int(user_id)
        except (TypeError, ValueError):
            raise ValueError("Access token contains invalid subject.") from None

        if database_user_id <= 0 or str(database_user_id) != str(user_id):
            raise ValueError("Access token contains invalid subject.")

        user = AuthRepository.get_user_by_id(db, database_user_id)
        if user is None or not user.is_active:
            raise ValueError("Account is unavailable.")

        current_roles = AuthRepository.get_user_roles(db, user.id)

        return IdentityService.build_identity(
            user_id=str(user.id),
            username=user.email,
            roles=current_roles,
            is_active=True,
        )

    @staticmethod
    def build_identity(
        user_id: str,
        username: str | None,
        roles: list[str] | tuple[str, ...] | set[str],
        *,
        is_active: bool = True,
    ) -> Identity:
        normalized_roles = frozenset(roles)

        return Identity(
            user_id=user_id,
            username=username,
            roles=normalized_roles,
            permissions=permissions_for_roles(normalized_roles),
            is_active=is_active,
        )


class AuthorizationService:
    """Creates authorization contexts for protected application operations."""

    @staticmethod
    def context(
        identity: Identity,
        *,
        request_id: str | None = None,
        source: str | None = None,
    ) -> AuthorizationContext:
        return AuthorizationContext(
            identity=identity,
            request_id=request_id,
            source=source,
        )
