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

    def snapshot(self) -> dict:
        """
        Retrieves live production snapshot from MT5 terminal via bridge.
        Returns exact structures expected by the Global Trading State orchestrator.
        """
        try:
            # If a live MT5 client is attached, fetch real data
            if self.mt5_client and hasattr(self.mt5_client, "get_account_info"):
                account_info = self.mt5_client.get_account_info()
                positions = self.mt5_client.get_positions()
                market_prices = self.mt5_client.get_market_prices()

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
