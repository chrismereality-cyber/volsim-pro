import time

from src.services.execution_service import execution_service
from src.services.counter_trend_execution_service import counter_trend_execution_service


class AIExecutionRouterService:
    """
    Institutional AI Execution Router.

    Converts AI counter-trend signals into
    controlled execution requests.

    Execution still passes through:

    AI Router
        |
        v
    Execution Service
        |
        v
    Risk Engine
        |
        v
    OMS
        |
        v
    MT5 Bridge
    """

    def __init__(self):

        self.state = {

            "status": "ONLINE",

            "execution_signal": "NONE",

            "last_action": "WAITING",

            "last_order": None,

            "last_update": time.time()

        }



    async def evaluate(self):

        signal = (
            counter_trend_execution_service.snapshot()
        )


        self.state["execution_signal"] = (
            signal.get(
                "signal",
                "NONE"
            )
        )


        if signal.get("signal") == "NONE":

            self.state.update({

                "last_action":
                    "NO_EXECUTION",

                "last_order":
                    None,

                "last_update":
                    time.time()

            })

            return self.state



        order_request = {

            "symbol":
                "XAUUSDm",


            "type":
                signal.get(
                    "signal"
                ),


            "volume":
                max(
                    0.01,
                    round(
                        signal.get(
                            "overlay_position_size",
                            0.25
                        ),
                        2
                    )
                ),


            "comment":
                "AI_COUNTER_TREND_OVERLAY"

        }



        result = await execution_service.send_order(
            order_request
        )


        self.state.update({

            "last_action":
                "ORDER_SENT",


            "last_order":
                result,


            "last_update":
                time.time()

        })


        return self.state



    def snapshot(self):

        return self.state



ai_execution_router_service = AIExecutionRouterService()
