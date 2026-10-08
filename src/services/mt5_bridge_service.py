import logging
from src.services.mt5_service import mt5_service

logger = logging.getLogger("volsim.mt5_bridge")

class MT5BridgeService:
    """
    Enterprise MT5 Bridge Service for VolSim-Pro.
    Owns account information, positions, pending orders, broker connectivity,
    live prices, margin, free margin, and leverage.
    """
    def __init__(self, mt5_client=None):
        self.mt5_client = mt5_client

    def connection_status(self) -> str:
        """
        Return lightweight MT5 bridge connection status.

        This intentionally avoids fetching account, position, or market
        snapshots because callers may only need connectivity telemetry.
        """
        try:
            if not self.mt5_client:
                return "disconnected"

            if not self.mt5_client.connect():
                return "disconnected"

            terminal = self.mt5_client.get_terminal_state()

            if terminal.get("connected", False):
                return "connected"

            return "disconnected"
        except Exception as exc:
            logger.error("Failed to read MT5 bridge connection status: %s", exc)
            return "error"

    def snapshot(
        self,
        account_override=None,
        include_market=True,
    ) -> dict:
        """
        Retrieves live production snapshot from MT5 terminal via bridge.

        An authoritative account snapshot may be supplied by an upstream
        caller to avoid reacquiring identical account data. Positions and
        market prices remain independently sourced from MT5.
        """
        try:
            # If a live MT5 client is attached, fetch real data
            if self.mt5_client and hasattr(self.mt5_client, "get_account_info"):
                account_info = (
                    account_override
                    if isinstance(account_override, dict)
                    else self.mt5_client.get_account_info()
                )
                positions = self.mt5_client.get_positions()
                market_prices = (
                    self.mt5_client.get_market_prices()
                    if include_market
                    else {}
                )

                return {
                    "account": account_info,
                    "positions": positions,
                    "market": market_prices,
                    "status": "connected"
                }
        except Exception as e:
            logger.error("Failed to fetch live MT5 bridge snapshot: %s", e)
            return {
                "account": {"balance": 0.0, "equity": 0.0, "free_margin": 0.0, "leverage": 100},
                "positions": [],
                "market": {},
                "status": "error",
                "message": str(e)
            }

        # Fallback structural return if client is uninitialized (prevents simulation stubs)
        return {
            "account": {
                "balance": 0.0,
                "equity": 0.0,
                "free_margin": 0.0,
                "margin": 0.0,
                "leverage": 100,
                "currency": "USD"
            },
            "positions": [],
            "market": {},
            "status": "disconnected"
        }

mt5_bridge_service = MT5BridgeService(mt5_service)
