import time


class AIExecutionService:
    """
    AI Execution Policy Layer.

    Converts AI decisions into controlled
    execution requests.

    Does NOT bypass:
    - Risk Engine
    - OMS
    - Execution Service
    """


    def __init__(self):

        self.state = {

            "status": "STANDBY",

            "execution_signal": "NONE",

            "last_action": "WAITING",

            "last_order": None,

            "last_update": time.time()

        }



    def evaluate(
        self,
        ai_decision,
        risk_state,
        portfolio_state
    ):


        decision = ai_decision.get(
            "decision",
            "HOLD"
        )


        confidence = float(
            ai_decision.get(
                "confidence",
                0
            )
        )


        self.state["execution_signal"] = decision



        #
        # Execution confidence filter
        #

        if confidence < 70:

            self.state.update({

                "status":
                    "STANDBY",

                "last_action":
                    "CONFIDENCE_TOO_LOW",

                "last_update":
                    time.time()

            })

            return self.state



        if decision not in [
            "BUY",
            "SELL"
        ]:

            self.state.update({

                "status":
                    "STANDBY",

                "last_action":
                    "NO_DIRECTION",

                "last_update":
                    time.time()

            })

            return self.state



        self.state.update({

            "status":
                "READY",

            "last_action":
                "EXECUTION_READY",

            "last_update":
                time.time()

        })


        return self.state



    def snapshot(self):

        return self.state



ai_execution_service = AIExecutionService()
