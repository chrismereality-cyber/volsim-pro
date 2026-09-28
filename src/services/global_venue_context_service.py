from __future__ import annotations

from typing import Any, Dict

from src.providers.registry import provider_registry


class GlobalVenueContextService:
    """
    Backend-owned global market/execution provider context.

    This service defines which provider is currently active for the
    VolSim-Pro trading environment.

    Initial behavior:
    - MT5 is the active provider.
    - Deriv remains fail-closed until its real adapter is configured.
    - No orders are submitted here.
    - No market state is mutated here.
    - No database state is changed here.

    Provider-specific market and execution behavior remains owned by
    provider adapters and execution infrastructure.
    """

    DEFAULT_PROVIDER = "MT5"

    def __init__(self) -> None:
        self._active_provider = self.DEFAULT_PROVIDER

    @property
    def active_provider(self) -> str:
        return self._active_provider

    def get_provider(self):
        return provider_registry.get(self._active_provider)

    def snapshot(self) -> Dict[str, Any]:
        provider = self.get_provider()

        if provider is None:
            return {
                "active_provider": self._active_provider,
                "provider_available": False,
                "status": "UNKNOWN_PROVIDER",
            }

        try:
            status = provider.status()
        except Exception as exc:
            return {
                "active_provider": self._active_provider,
                "provider_available": False,
                "status": "ERROR",
                "error": str(exc),
            }

        return {
            "active_provider": self._active_provider,
            "provider_available": bool(
                status.get("available", False)
            ),
            "provider_status": status,
            "venue": status.get(
                "venue",
                getattr(provider, "venue_id", ""),
            ),
            "display_name": status.get(
                "display_name",
                getattr(provider, "display_name", ""),
            ),
        }


global_venue_context_service = GlobalVenueContextService()
