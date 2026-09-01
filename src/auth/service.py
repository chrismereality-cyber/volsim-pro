from .models import AuthorizationContext, Identity
from .rbac import permissions_for_roles


class IdentityService:
    """Builds normalized identities from trusted authentication data."""

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
