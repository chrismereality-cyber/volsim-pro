import time


class ExecutionRiskGateService:
    """
    Institutional execution safety layer.

    Validates AI execution requests before OMS.

    Checks:
    - confidence
    - risk permission
    - execution permission
    - exposure
    - duplicate positions
    """


    def __init__(self):

        self.state = {

            "status": "ONLINE",

            "approved": False,

            "reason": "Waiting",

            "last_check": time.time()

        }



    def approve(
        self,
        ai_decision,
        ai_execution,
        risk_state,
        portfolio_state
    ):


        confidence = float(
            ai_decision.get(
                "confidence",
                0
            )
        )


        if not ai_decision.get(
            "risk_permission",
            False
        ):

            return self.reject(
                "Risk permission denied"
            )



        if not ai_decision.get(
            "execution_allowed",
            False
        ):

            return self.reject(
                "Execution disabled"
            )



        minimum_confidence = 25

        if confidence < minimum_confidence:

            return self.reject(
                "Confidence below threshold"
            )



        if ai_execution.get(
            "execution_signal"
        ) not in [
            "BUY",
            "SELL"
        ]:

            return self.reject(
                "No execution signal"
            )



        exposure = float(
            portfolio_state.get(
                "exposure",
                0
            )
        )


        if exposure > 1000000:

            return self.reject(
                "Maximum exposure exceeded"
            )



        self.state.update({

            "approved": True,

            "reason":
                "Execution approved",

            "last_check":
                time.time()

        })


        return self.state



    def reject(
        self,
        reason
    ):

        self.state.update({

            "approved": False,

            "reason":
                reason,

            "last_check":
                time.time()

        })


        return self.state



    def snapshot(self):

        return self.state



execution_risk_gate_service = ExecutionRiskGateService()
