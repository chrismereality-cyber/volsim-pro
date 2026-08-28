import time
import uuid
import logging


logger = logging.getLogger("volsim.oms")


class OMSService:
    """
    Enterprise Order Management System.

    Owns:
    - order lifecycle
    - order tracking
    - execution history
    - preservation of original order intent

    Does NOT own:
    - risk calculations
    - execution
    - portfolio accounting
    """

    def __init__(self):

        self.orders = {}

    def create_order(self, order_request: dict):
        """
        Create an OMS order from the normalized order request.

        The OMS preserves the original execution intent so that
        the complete order can be audited after submission.
        """

        order_id = str(uuid.uuid4())

        order = {

            "order_id":
                order_id,

            # ----------------------------------------------------------
            # Original order intent
            # ----------------------------------------------------------

            "symbol":
                order_request.get("symbol"),

            "side":
                order_request.get("type"),

            "volume":
                float(
                    order_request.get(
                        "volume",
                        0.0
                    )
                    or 0.0
                ),

            "price":
                float(
                    order_request.get(
                        "price",
                        0.0
                    )
                    or 0.0
                ),

            "stop_loss":
                float(
                    order_request.get(
                        "stop_loss",
                        0.0
                    )
                    or 0.0
                ),

            "take_profit":
                float(
                    order_request.get(
                        "take_profit",
                        0.0
                    )
                    or 0.0
                ),

            "magic":
                order_request.get(
                    "magic",
                    202607
                ),

            "comment":
                order_request.get(
                    "comment",
                    "VolSim-Pro"
                ),

            # ----------------------------------------------------------
            # Lifecycle
            # ----------------------------------------------------------

            "status":
                "CREATED",

            "created_at":
                time.time(),

            "updated_at":
                time.time(),

            # ----------------------------------------------------------
            # Execution result
            # ----------------------------------------------------------

            "execution_result":
                None,

            # ----------------------------------------------------------
            # Trade accounting
            # ----------------------------------------------------------

            "profit":
                0.0,

            "commission":
                0.0,

            "swap":
                0.0,

            "close_price":
                None,

            "filled_at":
                None,

            "closed_at":
                None,

        }

        self.orders[order_id] = order

        logger.info(
            "OMS order created: %s %s %.4f",
            order["side"],
            order["symbol"],
            order["volume"],
        )

        return order

    def update_status(
        self,
        order_id,
        status,
        execution_result=None,
    ):
        """
        Update the lifecycle state of an OMS order.

        Successful execution results preserve the explicitly
        requested lifecycle state.

        Supported terminal execution states include:

            FILLED
            CLOSED
            REJECTED
        """

        if order_id not in self.orders:

            logger.warning(
                "OMS order not found: %s",
                order_id,
            )

            return None

        order = self.orders[order_id]

        # Preserve the explicitly requested lifecycle state.
        order["status"] = status

        if execution_result is not None:

            order["execution_result"] = execution_result

            if execution_result.get("success"):

                if status == "FILLED":

                    order["filled_at"] = time.time()

                elif status == "CLOSED":

                    order["closed_at"] = time.time()

                    close_price = execution_result.get(
                        "close_price"
                    )

                    if close_price is not None:

                        order["close_price"] = float(
                            close_price
                        )

                    realized_pl = execution_result.get(
                        "realized_pl"
                    )

                    if realized_pl is not None:

                        order["profit"] = float(
                            realized_pl
                        )

                # Do NOT automatically overwrite the requested
                # status with FILLED.

        order["updated_at"] = time.time()

        return order

    def get_order(self, order_id):

        return self.orders.get(order_id)

    def snapshot(self):

        return {

            "total_orders":
                len(self.orders),

            "orders":
                list(self.orders.values()),

        }


oms_service = OMSService()
