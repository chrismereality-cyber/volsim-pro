import time


class OrderBuilderService:
    """
    Institutional Order Construction Layer.

    Converts approved AI execution signals
    into OMS-compatible order requests.

    Does NOT:
    - bypass risk
    - execute orders
    - manage positions
    """


    def __init__(self):

        self.state = {

            "status": "STANDBY",

            "order_ready": False,

            "order_request": None,

            "last_update": time.time()

        }



    def build(
        self,
        ai_decision,
        execution_risk
    ):


        if not execution_risk.get(
            "approved",
            False
        ):

            self.state.update({

                "status":
                    "BLOCKED",

                "order_ready":
                    False,

                "order_request":
                    None,

                "last_update":
                    time.time()

            })

            return self.state



        decision = ai_decision.get(
            "decision",
            "HOLD"
        )


        if decision not in [
            "BUY",
            "SELL"
        ]:

            self.state.update({

                "status":
                    "WAITING",

                "order_ready":
                    False,

                "order_request":
                    None,

                "last_update":
                    time.time()

            })

            return self.state



        order = {

            "symbol":
                "XAUUSDm",


            "type":
                decision,


            "volume":
                0.01,


            "price":
                0.0,


            "stop_loss":
                0.0,


            "take_profit":
                0.0,


            "magic":
                202607,


            "comment":
                "VolSim-Pro AI Execution"

        }



        self.state.update({

            "status":
                "READY",

            "order_ready":
                True,

            "order_request":
                order,

            "last_update":
                time.time()

        })


        return self.state



def snapshot(self):

    return self.state



order_builder_service = OrderBuilderService()
