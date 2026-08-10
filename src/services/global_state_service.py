import time

from src.services.mt5_service import mt5_service
from src.services.execution_service import execution_service
from src.services.vault_service import vault_service
from src.services.oms_service import oms_service
from src.services.telemetry_service import telemetry_service
from src.services.ai_service import ai_service

try:
    from src.services.portfolio_service import portfolio_service
except Exception:
    portfolio_service = None

try:
    from src.services.risk_service import risk_engine_service
except Exception:
    risk_engine_service = None

try:
    from src.services.statistics_service import statistics_service
except Exception:
    statistics_service = None


class GlobalStateOrchestrator:

    def snapshot(self):

        #
        # MT5 DATA SOURCE
        #

        account = mt5_service.get_account_state()

        market = mt5_service.get_market_state()

        positions = mt5_service.get_position_state()

        orders = mt5_service.get_orders()

        terminal = mt5_service.get_terminal_state()


        #
        # PORTFOLIO STATE
        #

        if portfolio_service:

            portfolio = portfolio_service.get_portfolio_state()

        else:

            portfolio = {

                "balance": account.get("balance", 0.0),

                "equity": account.get("equity", 0.0),

                "floating_pl": 0.0,

                "realized_pl": 0.0,

                "daily_pl": 0.0,

                "weekly_pl": 0.0,

                "monthly_pl": 0.0,

                "exposure": positions.get(
                    "total_exposure",
                    0.0
                ),

                "allocations": {},

                "open_positions": len(
                    positions.get(
                        "open_positions",
                        []
                    )
                )

            }


        #
        # RISK STATE
        #

        #
        # RISK STATE
        #

        risk_state = risk_engine_service.snapshot()



        #
        # STATISTICS STATE
        #

        #
        # STATISTICS STATE
        #

        statistics_state = statistics_service.snapshot()



        #
        # EXECUTION STATE
        #

        execution_state = execution_service.snapshot()



        #
        # VAULT STATE
        #

        vault_state = vault_service.snapshot()


        #
        # AI STATE
        #

        #
        # AI STATE
        #

        ai_state = ai_service.snapshot()



        #
        # TELEMETRY STATE
        #

        #
        # TELEMETRY STATE
        #

        telemetry_state = telemetry_service.snapshot()



        return {

            "account_state": account,

            "market_state": market,

            "position_state": positions,

            "order_state": {

                "pending_orders": orders,

                "count": len(orders),

                "oms": oms_service.snapshot()

            },

            "terminal_state": terminal,

            "portfolio_state": portfolio,

            "execution_state": execution_state,

            "risk_state": risk_state,

            "statistics_state": statistics_state,

            "vault_state": vault_state,

            "ai_state": ai_state,

            "telemetry_state": telemetry_state,

            "timestamp": time.time()

        }


global_state_orchestrator = GlobalStateOrchestrator()
