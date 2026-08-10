
import logging

from src.services.oms_service import oms_service


logger = logging.getLogger("volsim.statistics")


class StatisticsService:
    """
    Enterprise Statistics Engine.

    Owns:
    - trade performance metrics
    - execution statistics
    - win/loss analysis

    Does NOT own:
    - execution
    - risk
    - portfolio aggregation
    """


    def __init__(self):

        self.oms = oms_service



    def snapshot(self):

        orders = self.oms.snapshot().get(
            "orders",
            []
        )


        completed = [

            order

            for order in orders

            if order.get("status") == "FILLED"

        ]


        profits = [

            float(
                order.get(
                    "profit",
                    0.0
                )
            )

            for order in completed

        ]


        wins = [

            p for p in profits

            if p > 0

        ]


        losses = [

            abs(p)

            for p in profits

            if p < 0

        ]


        trade_count = len(completed)


        win_rate = 0.0

        if trade_count:

            win_rate = (
                len(wins)
                /
                trade_count
            ) * 100


        average_win = (
            sum(wins) / len(wins)
            if wins
            else 0.0
        )


        average_loss = (
            sum(losses) / len(losses)
            if losses
            else 0.0
        )


        profit_factor = 0.0

        if sum(losses) > 0:

            profit_factor = (
                sum(wins)
                /
                sum(losses)
            )


        expectancy = 0.0

        if trade_count:

            expectancy = (

                (win_rate / 100)
                *
                average_win

                -

                ((1 - win_rate / 100)
                *
                average_loss)

            )


        return {

            "status": "ONLINE",

            "win_rate": round(
                win_rate,
                2
            ),

            "expectancy": round(
                expectancy,
                2
            ),

            "profit_factor": round(
                profit_factor,
                2
            ),

            "sharpe_ratio": 0.0,

            "sortino_ratio": 0.0,

            "recovery_factor": 0.0,

            "average_win": round(
                average_win,
                2
            ),

            "average_loss": round(
                average_loss,
                2
            ),

            "trade_count": trade_count

        }



statistics_service = StatisticsService()
