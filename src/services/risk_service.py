import logging

from src.services.portfolio_service import portfolio_service

logger = logging.getLogger("volsim.risk_service")


class RiskEngineService:
    """
    Production Risk Engine Service.

    Owns:
    - drawdown monitoring
    - VaR
    - margin usage
    - liquidation checks
    - hedge recommendations

    This service exposes risk state.
    It does not own dashboard aggregation.
    """

    def __init__(self):
        pass




    def approve_order(self, order_request: dict):
        """
        Execution gate.

        Validates whether an order is allowed
        before execution.

        This service does not execute trades.
        It only approves or rejects risk.
        """

        state = self.snapshot()


        # Drawdown protection

        if (
            state["current_drawdown"]
            >=
            state["maximum_allowed_drawdown"]
        ):

            return {

                "approved": False,

                "reason":
                    "Maximum drawdown exceeded"

            }


        # Liquidation protection

        if state["liquidation_warning"]:

            return {

                "approved": False,

                "reason":
                    "Liquidation risk active"

            }


        # Basic order validation

        if not order_request.get("symbol"):

            return {

                "approved": False,

                "reason":
                    "Missing symbol"

            }


        if not order_request.get("volume"):

            return {

                "approved": False,

                "reason":
                    "Missing volume"

            }


        volume = float(
            order_request.get(
                "volume",
                0
            )
        )


        symbol = order_request.get(
            "symbol"
        )


        # Symbol protection

        allowed_symbols = [
            "XAUUSDm",
            "EURUSD",
            "GBPUSD"
        ]


        if symbol not in allowed_symbols:

            return {

                "approved": False,

                "reason":
                    "Symbol not allowed"

            }


        # Maximum position size protection

        maximum_volume = 5.0


        if volume > maximum_volume:

            return {

                "approved": False,

                "reason":
                    "Maximum volume exceeded"

            }


        return {

            "approved": True,

            "reason":
                "Risk limits acceptable",

            "risk_score": 0,

            "checks": {

                "drawdown": "PASS",

                "liquidation": "PASS",

                "symbol": "PASS",

                "volume": "PASS"

            }

        }


    def snapshot(self):

        try:

            portfolio = portfolio_service.snapshot()

            balance = float(
                portfolio.get(
                    "balance",
                    0.0
                )
            )

            equity = float(
                portfolio.get(
                    "equity",
                    0.0
                )
            )

            exposure = float(
                portfolio.get(
                    "exposure",
                    0.0
                )
            )


            if balance > 0:

                current_drawdown = max(
                    0,
                    round(
                        ((balance - equity) / balance) * 100,
                        2
                    )
                )

            else:

                current_drawdown = 0.0


            margin = float(
                portfolio.get(
                    "margin",
                    0.0
                )
            )

            margin_usage = 0.0

            if equity > 0:

                margin_usage = round(
                    (margin / equity) * 100,
                    2
                )


            liquidation_warning = (
                current_drawdown >= 10
                or
                margin_usage >= 80
            )


            return {

                "risk_per_trade": 1.0,

                "current_drawdown": current_drawdown,

                "maximum_allowed_drawdown": 5.0,

                "margin_usage": margin_usage,

                "value_at_risk": 0.0,

                "hedging_signals": [],

                "liquidation_warning": liquidation_warning,

                "status": "active"

            }


        except Exception as e:

            return {

                "risk_per_trade": 1.0,

                "current_drawdown": 0.0,

                "maximum_allowed_drawdown": 5.0,

                "margin_usage": 0.0,

                "value_at_risk": 0.0,

                "hedging_signals": [],

                "liquidation_warning": False,

                "status": "error",

                "error": str(e)

            }




risk_engine_service = RiskEngineService()
