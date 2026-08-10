import time
import json
import asyncio
import logging
import MetaTrader5 as mt5

from src.services.mt5_bridge_service import mt5_bridge_service
from src.services.risk_service import risk_engine_service
from src.services.oms_service import oms_service
from src.services.position_service import position_service
from src.services.database_service import database_service


logger = logging.getLogger("volsim.execution_service")


class ExecutionService:
    """
    Enterprise Execution Service.

    Owns:
    - execution health
    - bridge connectivity
    - broker connectivity
    - order execution telemetry

    Does NOT own:
    - portfolio calculations
    - risk calculations
    - statistics
    - AI decisions
    - vault logic
    """


    def __init__(self):

        self.started_at = time.time()

        self.orders_sent = 0
        self.orders_filled = 0
        self.orders_rejected = 0

        self.last_order_time = None
        self.last_fill_time = None
        self.last_error = None

        self.execution_latency_ms = 0

        # Execution safety mode
        # PAPER prevents accidental broker orders
        self.execution_mode = "PAPER"



    async def record_trade_ledger(
        self,
        order_request: dict,
        result: dict,
        status: str
    ):

        try:

            await database_service.execute(
                """
                INSERT INTO trade_ledger
                (
                    id,
                    trade_id,
                    symbol,
                    side,
                    quantity,
                    price,
                    status,
                    event_type,
                    timestamp,
                    metadata
                )
                VALUES
                (
                    gen_random_uuid(),
                    $1,$2,$3,$4,$5,$6,$7,NOW(),$8
                )
                """,
                str(
                    result.get(
                        "ticket",
                        "UNKNOWN"
                    )
                ),
                order_request.get(
                    "symbol"
                ),
                order_request.get(
                    "type"
                ),
                order_request.get(
                    "volume",
                    0
                ),
                result.get(
                    "price",
                    order_request.get(
                        "price",
                        0
                    )
                ),
                status,
                "EXECUTION",
                json.dumps(result)
            )

        except Exception as e:

            print(
                "TRADE LEDGER INSERT ERROR:",
                repr(e)
            )

            logger.error(
                "Trade ledger insert failed: %s",
                e
            )




    async def send_order(self, order_request: dict):

        start = time.time()


        order = oms_service.create_order(
            order_request
        )

        order_id = order["order_id"]


        try:

            risk_result = risk_engine_service.approve_order(
                order_request
            )


            if not risk_result.get("approved"):

                self.orders_rejected += 1

                self.last_error = risk_result.get(
                    "reason",
                    "Risk rejected"
                )


                oms_service.update_status(
                    order_id,
                    "REJECTED",
                    risk_result
                )


                return {

                    "success": False,

                    "order_id": order_id,

                    "reason": self.last_error,

                    "risk": risk_result

                }


            if self.execution_mode == "PAPER":

                self.orders_sent += 1
                self.orders_filled += 1

                self.last_order_time = time.time()
                self.last_fill_time = time.time()

                self.execution_latency_ms = round(
                    (time.time() - start) * 1000,
                    2
                )

                result = {

                    "success": True,

                    "mode": "PAPER",

                    "ticket": "SIMULATED",

                    "retcode": "SIMULATED_FILL",

                    "price": order_request.get(
                        "price",
                        3300.0
                    )

                }


                oms_service.update_status(
                    order_id,
                    "FILLED",
                    result
                )


                await self.record_trade_ledger(
                    order_request,
                    result,
                    "FILLED"
                )


                position = await position_service.open_position(
                    result.get(
                        "ticket",
                        "SIMULATED"
                    ),
                    order_request,
                    result
                )


                await position_service.persist_snapshot(
                    position
                )


                return {

                    "order_id": order_id,

                    **result

                }


            request = {

                "action": mt5.TRADE_ACTION_DEAL,

                "symbol": order_request.get("symbol"),

                "volume": order_request.get(
                    "volume",
                    0.01
                ),

                "type":
                    (
                        mt5.ORDER_TYPE_BUY
                        if order_request.get("type") == "BUY"
                        else mt5.ORDER_TYPE_SELL
                    ),

                "price": order_request.get(
                    "price",
                    0
                ),

                "sl": order_request.get(
                    "stop_loss",
                    0
                ),

                "tp": order_request.get(
                    "take_profit",
                    0
                ),

                "deviation": 20,

                "magic": 202607,

                "comment": "VolSim-Pro"

            }


            result = mt5.order_send(request)


            self.orders_sent += 1

            self.last_order_time = time.time()


            self.execution_latency_ms = round(
                (time.time() - start) * 1000,
                2
            )


            if result is None:

                self.orders_rejected += 1

                self.last_error = "No response from MT5"

                return {

                    "success": False,

                    "ticket": None,

                    "message": self.last_error

                }


            if result.retcode == mt5.TRADE_RETCODE_DONE:

                self.orders_filled += 1

                self.last_fill_time = time.time()

                execution_result = {

                    "success": True,

                    "ticket": result.order,

                    "retcode": result.retcode

                }


                oms_service.update_status(
                    order_id,
                    "FILLED",
                    execution_result
                )


                return {

                    "order_id": order_id,

                    **execution_result

                }


            self.orders_rejected += 1

            self.last_error = str(
                result.retcode
            )


            return {

                "success": False,

                "ticket": None,

                "retcode": result.retcode,

                "message": self.last_error

            }


        except Exception as e:

            self.orders_rejected += 1

            self.last_error = str(e)

            logger.error(
                "Order execution failed: %s",
                e
            )

            oms_service.update_status(
                order_id,
                "FAILED",
                {
                    "error": str(e)
                }
            )


            return {

                "success": False,

                "order_id": order_id,

                "ticket": None,

                "message": str(e)

            }


    def snapshot(self):

        try:

            bridge = mt5_bridge_service.snapshot()

            bridge_status = bridge.get(
                "status",
                "unknown"
            )


            terminal = {}

            try:
                terminal = bridge.get(
                    "terminal",
                    {}
                )
            except Exception:
                terminal = {}


            connected = (
                "ONLINE"
                if bridge_status == "connected"
                else "OFFLINE"
            )


            return {

                "status": "ONLINE",

                "engine_status": "ACTIVE",

                "bridge_connection_status": connected,

                "broker_connection_status": connected,

                "execution_latency_ms": self.execution_latency_ms,

                "broker_latency_ms": 0,

                "slippage_average": 0,

                "orders_sent": self.orders_sent,

                "orders_filled": self.orders_filled,

                "orders_rejected": self.orders_rejected,

                "orders_pending": len(
                    bridge.get(
                        "positions",
                        []
                    )
                ),

                "last_order_time": self.last_order_time,

                "last_fill_time": self.last_fill_time,

                "last_error": self.last_error,

                "execution_mode": self.execution_mode,

                "heartbeat": time.time(),

                "health_score": (
                    100
                    if connected == "ONLINE"
                    else 50
                ),

                "uptime":
                    round(
                        time.time()
                        -
                        self.started_at,
                        2
                    )

            }


        except Exception as e:

            logger.error(
                "Execution snapshot failure: %s",
                e
            )

            return {

                "status": "ERROR",

                "engine_status": "DEGRADED",

                "bridge_connection_status": "UNKNOWN",

                "broker_connection_status": "UNKNOWN",

                "last_error": str(e),

                "heartbeat": time.time(),

                "health_score": 0

            }


execution_service = ExecutionService()
