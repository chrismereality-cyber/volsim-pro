
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

    Does NOT own:
    - risk calculations
    - execution
    - portfolio accounting
    """


    def __init__(self):

        self.orders = {}



    def create_order(self, order_request: dict):

        order_id = str(uuid.uuid4())


        order = {

            "order_id": order_id,

            "symbol":
                order_request.get("symbol"),

            "side":
                order_request.get("type"),

            "volume":
                order_request.get("volume"),

            "status":
                "CREATED",

            "created_at":
                time.time(),

            "execution_result":
                None,

            "profit":
                0.0,

            "commission":
                0.0,

            "swap":
                0.0,

            "close_price":
                None,

            "filled_at":
                None

        }


        self.orders[order_id] = order


        return order



    def update_status(
        self,
        order_id,
        status,
        execution_result=None
    ):

        if order_id not in self.orders:

            return None


        self.orders[order_id]["status"] = status


        if execution_result:

            self.orders[order_id]["execution_result"] = execution_result


            if execution_result.get("success"):

                self.orders[order_id]["filled_at"] = time.time()


                self.orders[order_id]["status"] = "FILLED"


        self.orders[order_id]["updated_at"] = time.time()


        return self.orders[order_id]



    def snapshot(self):

        return {

            "total_orders":
                len(self.orders),

            "orders":
                list(self.orders.values())

        }



oms_service = OMSService()
