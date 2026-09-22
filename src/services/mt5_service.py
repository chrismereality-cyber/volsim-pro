import MetaTrader5 as mt5
import time


class MT5Service:

    SYMBOLS = [
        "XAUUSDm",
        "EURUSD",
        "GBPUSD"
    ]


    def __init__(self):
        self.initialized = False


    def connect(self):

        if self.initialized:
            return True

        self.initialized = mt5.initialize()

        if self.initialized:
            for symbol in self.SYMBOLS:
                mt5.symbol_select(symbol, True)

        return self.initialized


    def discover_symbols(self):
        """
        Discover the complete MT5 instrument universe exposed by the
        connected terminal.

        This is discovery only. It does not select symbols, submit orders,
        or change broker/account state.
        """
        if not self.connect():
            return []

        try:
            symbols = mt5.symbols_get()
        except Exception:
            return []

        if symbols is None:
            return []

        return list(symbols)


    def get_instrument_registry(self):
        """
        Return the authoritative MT5 instrument registry.

        Discovery, visibility, quote availability, and execution readiness
        are deliberately represented as separate states.

        This method is read-only:
        - no orders are submitted
        - no database state is changed
        - no vault/treasury state is touched
        - symbols are not automatically selected
        """
        symbols = self.discover_symbols()

        registry = []

        for info in symbols:
            symbol = str(getattr(info, "name", "") or "").strip()

            if not symbol:
                continue

            try:
                tick = mt5.symbol_info_tick(symbol)
            except Exception:
                tick = None

            visible = bool(getattr(info, "visible", False))
            trade_mode = int(getattr(info, "trade_mode", 0) or 0)

            bid = float(getattr(tick, "bid", 0.0) or 0.0) if tick else 0.0
            ask = float(getattr(tick, "ask", 0.0) or 0.0) if tick else 0.0
            last = float(getattr(tick, "last", 0.0) or 0.0) if tick else 0.0
            tick_timestamp = int(getattr(tick, "time", 0) or 0) if tick else 0

            quoteable = bool(
                tick
                and bid > 0
                and ask > 0
                and ask >= bid
            )

            trade_enabled = (
                trade_mode != mt5.SYMBOL_TRADE_MODE_DISABLED
            )

            execution_ready = bool(
                visible
                and quoteable
                and trade_enabled
            )

            path_value = str(
                getattr(info, "path", "") or ""
            )

            category = (
                path_value.split("\\")[1]
                if len(path_value.split("\\")) > 1
                else ""
            )

            registry.append({
                "symbol": symbol,
                "path": path_value,
                "category": category,
                "description": str(
                    getattr(info, "description", "") or ""
                ),
                "visible": visible,
                "trade_mode": trade_mode,
                "quoteable": quoteable,
                "bid": bid,
                "ask": ask,
                "last": last,
                "tick_timestamp": tick_timestamp,
                "volume_min": float(
                    getattr(info, "volume_min", 0.0) or 0.0
                ),
                "volume_max": float(
                    getattr(info, "volume_max", 0.0) or 0.0
                ),
                "volume_step": float(
                    getattr(info, "volume_step", 0.0) or 0.0
                ),
                "digits": int(
                    getattr(info, "digits", 0) or 0
                ),
                "point": float(
                    getattr(info, "point", 0.0) or 0.0
                ),
                "trade_tick_size": float(
                    getattr(info, "trade_tick_size", 0.0) or 0.0
                ),
                "trade_tick_value": float(
                    getattr(info, "trade_tick_value", 0.0) or 0.0
                ),
                "trade_contract_size": float(
                    getattr(info, "trade_contract_size", 0.0) or 0.0
                ),
                "trade_stops_level": int(
                    getattr(info, "trade_stops_level", 0) or 0
                ),
                "trade_freeze_level": int(
                    getattr(info, "trade_freeze_level", 0) or 0
                ),
                "filling_mode": int(
                    getattr(info, "filling_mode", 0) or 0
                ),
                "execution_ready": execution_ready,
            })

        registry.sort(key=lambda item: item["symbol"])

        return registry


    def get_account_info(self):

        if not self.connect():
            return {}

        account = mt5.account_info()

        if not account:
            return {}

        realized_result = self.get_realized_trading_pl()

        realized_pl = float(
            realized_result.get(
                "realized_trading_pl",
                0.0
            )
            or 0.0
        )

        return {
            "balance": account.balance,
            "equity": account.equity,
            "margin": account.margin,
            "free_margin": account.margin_free,
            "leverage": account.leverage,
            "currency": account.currency,
            "realized_pl": realized_pl
        }


    def get_account_state(self):

        account = self.get_account_info()

        return {
            "balance": account.get("balance", 0.0),
            "equity": account.get("equity", 0.0),
            "margin": account.get("margin", 0.0),
            "free_margin": account.get("free_margin", 0.0),
            "margin_level": 0.0,
            "currency": account.get("currency", "USD"),
            "leverage": account.get("leverage", 100),
            "realized_pl": account.get("realized_pl", 0.0)
        }


    def get_market_state(self):

        return self.get_market_prices()


    def get_market_prices(self):

        if not self.connect():
            return {}

        market = {}

        for symbol in self.SYMBOLS:

            tick = mt5.symbol_info_tick(symbol)

            if not tick:
                continue

            info = mt5.symbol_info(symbol)

            market[symbol] = {
                "symbol": symbol,
                "bid": tick.bid,
                "ask": tick.ask,
                "last": tick.last,
                "spread": round(tick.ask - tick.bid, info.digits),
                "point": info.point,
                "digits": info.digits,
                "timestamp": tick.time
            }

        return market


    def get_positions_for_reconciliation(self):
        """
        Return the authoritative MT5 open-position snapshot for LIVE
        reconciliation.

        Distinguishes:
            successful query with positions
            successful query with zero positions
            MT5 query/connection failure

        A broker query failure must never be interpreted as zero positions.
        """
        if not self.connect():
            error = mt5.last_error()
            return {
                "success": False,
                "positions": [],
                "error": f"MT5 initialization failed: {error}",
            }

        try:
            positions = mt5.positions_get()
        except Exception as exc:
            return {
                "success": False,
                "positions": [],
                "error": f"MT5 positions_get exception: {exc}",
            }

        if positions is None:
            error = mt5.last_error()
            return {
                "success": False,
                "positions": [],
                "error": f"MT5 positions_get returned None: {error}",
            }

        result = []

        for position in positions:
            result.append({
                "ticket": getattr(position, "ticket", None),
                "symbol": getattr(position, "symbol", ""),
                "type": (
                    "BUY"
                    if getattr(position, "type", None) == mt5.POSITION_TYPE_BUY
                    else "SELL"
                    if getattr(position, "type", None) == mt5.POSITION_TYPE_SELL
                    else str(getattr(position, "type", None))
                ),
                "volume": float(getattr(position, "volume", 0.0) or 0.0),
                "price_open": float(getattr(position, "price_open", 0.0) or 0.0),
                "price_current": float(
                    getattr(position, "price_current", 0.0) or 0.0
                ),
                "profit": float(getattr(position, "profit", 0.0) or 0.0),
                "swap": float(getattr(position, "swap", 0.0) or 0.0),
                "magic": getattr(position, "magic", None),
                "comment": getattr(position, "comment", ""),
                "time": getattr(position, "time", None),
            })

        return {
            "success": True,
            "positions": result,
            "error": None,
        }


    def resolve_broker_position_sources(self, symbol=None, deal_ticket=None):
        """
        Provide raw MT5 broker sources required to resolve an executed
        position ticket.

        ExecutionService owns retry/fallback policy. MT5Service owns
        direct MT5 API access.

        Returns:
            {
                "success": bool,
                "deals": list,
                "positions": list,
                "error": str | None,
            }
        """
        if not self.connect():
            error = mt5.last_error()
            return {
                "success": False,
                "deals": [],
                "positions": [],
                "error": f"MT5 initialization failed: {error}",
            }

        deals = []
        positions = []

        if deal_ticket is not None:
            try:
                deal_history = mt5.history_deals_get(
                    ticket=deal_ticket
                )
            except Exception as exc:
                return {
                    "success": False,
                    "deals": [],
                    "positions": [],
                    "error": f"MT5 history_deals_get exception: {exc}",
                }

            if deal_history is None:
                error = mt5.last_error()
                return {
                    "success": False,
                    "deals": [],
                    "positions": [],
                    "error": f"MT5 history_deals_get returned None: {error}",
                }

            deals = list(deal_history)

        if symbol:
            try:
                broker_positions = mt5.positions_get(
                    symbol=symbol
                )
            except Exception as exc:
                return {
                    "success": False,
                    "deals": deals,
                    "positions": [],
                    "error": f"MT5 positions_get exception: {exc}",
                }

            if broker_positions is None:
                error = mt5.last_error()
                return {
                    "success": False,
                    "deals": deals,
                    "positions": [],
                    "error": f"MT5 positions_get returned None: {error}",
                }

            positions = list(broker_positions)

        return {
            "success": True,
            "deals": deals,
            "positions": positions,
            "error": None,
        }

    def get_positions(self):

        if not self.connect():
            return []

        positions = mt5.positions_get()

        if not positions:
            return []

        result = []

        for p in positions:

            result.append({

                "ticket": p.ticket,

                "symbol": p.symbol,

                "type": (
                    "BUY"
                    if p.type == mt5.ORDER_TYPE_BUY
                    else "SELL"
                ),

                "volume": p.volume,

                "price_open": p.price_open,

                "price_current": p.price_current,

                "stop_loss": p.sl,

                "take_profit": p.tp,

                "profit": p.profit,

                "swap": p.swap,

                "magic": p.magic,

                "comment": p.comment,

                "time": p.time

            })

        return result


    def get_position_state(self):

        positions = self.get_positions()

        exposure = 0.0

        for position in positions:

            exposure += abs(
                position["volume"] *
                position["price_current"]
            )

        return {

            "open_positions": positions,

            "total_exposure": exposure

        }


    def get_orders(self):

        if not self.connect():
            return []

        orders = mt5.orders_get()

        if not orders:
            return []

        result = []

        for o in orders:

            result.append({

                "ticket": o.ticket,

                "symbol": o.symbol,

                "type": o.type,

                "volume": o.volume_initial,

                "price": o.price_open,

                "stop_loss": o.sl,

                "take_profit": o.tp,

                "time_setup": o.time_setup,

                "magic": o.magic,

                "comment": o.comment

            })

        return result


    def get_terminal_state(self):

        terminal = mt5.terminal_info()

        if not terminal:
            return {}

        return {

            "connected": terminal.connected,

            "trade_allowed": terminal.trade_allowed,

            "tradeapi_disabled": terminal.tradeapi_disabled,

            "dlls_allowed": terminal.dlls_allowed,

            "community_account": terminal.community_account,

            "build": terminal.build,

            "company": terminal.company,

            "name": terminal.name,

            "language": terminal.language

        }
    def get_symbol_execution_context(self, symbol):
        """
        Return the live broker execution context for a symbol.
        Provides:
        - bid
        - ask
        - last
        - point
        - digits
        - tick size
        - tick value
        - volume constraints
        - stop/freeze constraints
        This method is informational only.
        It does not submit orders.
        """
        if not self.connect():
            return {}
        tick = mt5.symbol_info_tick(symbol)
        info = mt5.symbol_info(symbol)
        if not tick or not info:
            return {}
        return {
            "symbol": symbol,
            "bid": float(tick.bid),
            "ask": float(tick.ask),
            "last": float(tick.last),
            "point": float(info.point),
            "digits": int(info.digits),
            "trade_tick_size":
                float(info.trade_tick_size),
            "trade_tick_value":
                float(info.trade_tick_value),
            "trade_contract_size":
                float(info.trade_contract_size),
            "volume_min":
                float(info.volume_min),
            "volume_max":
                float(info.volume_max),
            "volume_step":
                float(info.volume_step),
            "trade_stops_level":
                int(info.trade_stops_level),
            "trade_freeze_level":
                int(info.trade_freeze_level),
            "trade_mode":
                int(info.trade_mode),
            "filling_mode":
                int(info.filling_mode),
            "timestamp":
                int(tick.time),
        }

    def get_symbol_market_gate(
        self,
        symbol,
        max_tick_age_seconds=300
    ):
        """
        Determine whether a symbol is currently safe to submit
        a live market order.

        This method does NOT submit orders.

        Returns a structured execution gate containing:
        - allowed
        - status
        - reason
        - connection state
        - trading permissions
        - symbol state
        - tick freshness
        """

        if not self.connect():
            return {
                "allowed": False,
                "status": "BROKER_DISCONNECTED",
                "symbol": symbol,
                "reason": "MT5 terminal is not connected.",
            }

        terminal = mt5.terminal_info()

        if not terminal:
            return {
                "allowed": False,
                "status": "BROKER_DISCONNECTED",
                "symbol": symbol,
                "reason": "Unable to read MT5 terminal state.",
            }

        if not terminal.connected:
            return {
                "allowed": False,
                "status": "BROKER_DISCONNECTED",
                "symbol": symbol,
                "reason": "MT5 terminal reports disconnected.",
            }

        if getattr(
            terminal,
            "tradeapi_disabled",
            False
        ):
            return {
                "allowed": False,
                "status": "TRADE_API_DISABLED",
                "symbol": symbol,
                "reason": "MT5 trade API is disabled.",
            }

        if not getattr(
            terminal,
            "trade_allowed",
            False
        ):
            return {
                "allowed": False,
                "status": "TRADING_DISABLED",
                "symbol": symbol,
                "reason": "MT5 terminal trading is disabled.",
            }

        info = mt5.symbol_info(symbol)

        if not info:
            return {
                "allowed": False,
                "status": "SYMBOL_UNAVAILABLE",
                "symbol": symbol,
                "reason": "MT5 symbol_info() returned no symbol.",
            }

        if not info.visible:
            return {
                "allowed": False,
                "status": "SYMBOL_NOT_VISIBLE",
                "symbol": symbol,
                "reason": "Symbol is not visible in Market Watch.",
            }

        tick = mt5.symbol_info_tick(symbol)

        if not tick:
            return {
                "allowed": False,
                "status": "NO_LIVE_QUOTE",
                "symbol": symbol,
                "reason": "No tick is available for the symbol.",
            }

        import time

        now = time.time()
        tick_timestamp = float(tick.time)
        tick_age = max(
            0.0,
            now - tick_timestamp
        )

        bid = float(tick.bid)
        ask = float(tick.ask)

        base_result = {
            "symbol": symbol,
            "trade_mode": int(info.trade_mode),
            "terminal_connected": bool(
                terminal.connected
            ),
            "terminal_trade_allowed": bool(
                terminal.trade_allowed
            ),
            "account_trade_allowed": None,
            "bid": bid,
            "ask": ask,
            "tick_timestamp": int(
                tick.timestamp
                if hasattr(tick, "timestamp")
                else tick.time
            ),
            "tick_age_seconds": round(
                tick_age,
                3
            ),
            "max_tick_age_seconds": max_tick_age_seconds,
        }

        account = mt5.account_info()

        if account:
            base_result["account_trade_allowed"] = bool(
                getattr(
                    account,
                    "trade_allowed",
                    False
                )
            )

            base_result["account_trade_expert"] = bool(
                getattr(
                    account,
                    "trade_expert",
                    False
                )
            )

            if not account.trade_allowed:
                return {
                    **base_result,
                    "allowed": False,
                    "status": "ACCOUNT_TRADING_DISABLED",
                    "reason": "Broker account trading permission is disabled.",
                }

        if bid <= 0 or ask <= 0:
            return {
                **base_result,
                "allowed": False,
                "status": "INVALID_QUOTE",
                "reason": (
                    f"Invalid bid/ask quote: "
                    f"bid={bid}, ask={ask}"
                ),
            }

        if ask < bid:
            return {
                **base_result,
                "allowed": False,
                "status": "INVALID_QUOTE",
                "reason": (
                    f"Invalid market quote: ask={ask} "
                    f"is below bid={bid}."
                ),
            }

        if tick_age > max_tick_age_seconds:
            return {
                **base_result,
                "allowed": False,
                "status": "MARKET_CLOSED",
                "reason": (
                    f"Latest tick is stale: "
                    f"{round(tick_age, 2)} seconds old."
                ),
            }

        if int(info.trade_mode) == mt5.SYMBOL_TRADE_MODE_DISABLED:
            return {
                **base_result,
                "allowed": False,
                "status": "SYMBOL_TRADE_DISABLED",
                "reason": "Broker has disabled trading for this symbol.",
            }

        return {
            **base_result,
            "allowed": True,
            "status": "MARKET_OPEN",
            "reason": "Symbol has a fresh executable quote.",
        }

    def check_market_gate(
        self,
        symbol: str,
        max_tick_age_seconds: int = 300,
    ):
        """
        Determine whether a symbol is currently eligible for execution.

        This method does not submit orders.

        Execution is allowed only when:
        - MT5 terminal is connected
        - terminal trading is allowed
        - account trading is allowed
        - expert trading is allowed
        - symbol exists and is visible
        - symbol trade mode permits trading
        - bid/ask are valid
        - latest tick is fresh
        """

        if not self.connect():
            return {
                "allowed": False,
                "status": "TERMINAL_DISCONNECTED",
                "reason": "MT5 terminal is not initialized.",
                "symbol": symbol,
            }

        terminal = mt5.terminal_info()
        account = mt5.account_info()
        info = mt5.symbol_info(symbol)
        tick = mt5.symbol_info_tick(symbol)

        if not terminal:
            return {
                "allowed": False,
                "status": "TERMINAL_DISCONNECTED",
                "reason": "Unable to obtain MT5 terminal information.",
                "symbol": symbol,
            }

        if not terminal.connected:
            return {
                "allowed": False,
                "status": "TERMINAL_DISCONNECTED",
                "reason": "MT5 terminal is disconnected.",
                "symbol": symbol,
            }

        if not terminal.trade_allowed:
            return {
                "allowed": False,
                "status": "TRADING_DISABLED",
                "reason": "MT5 terminal trading is disabled.",
                "symbol": symbol,
            }

        if not account:
            return {
                "allowed": False,
                "status": "ACCOUNT_UNAVAILABLE",
                "reason": "MT5 account information unavailable.",
                "symbol": symbol,
            }

        if not account.trade_allowed:
            return {
                "allowed": False,
                "status": "TRADING_DISABLED",
                "reason": "Account trading is disabled.",
                "symbol": symbol,
            }

        if not account.trade_expert:
            return {
                "allowed": False,
                "status": "EXPERT_TRADING_DISABLED",
                "reason": "Expert trading is disabled for the account.",
                "symbol": symbol,
            }

        if not info:
            return {
                "allowed": False,
                "status": "SYMBOL_UNAVAILABLE",
                "reason": f"Symbol {symbol} is unavailable.",
                "symbol": symbol,
            }

        if not info.visible:
            return {
                "allowed": False,
                "status": "SYMBOL_NOT_VISIBLE",
                "reason": f"Symbol {symbol} is not visible.",
                "symbol": symbol,
            }

        if not tick:
            return {
                "allowed": False,
                "status": "NO_TICK",
                "reason": f"No tick is available for {symbol}.",
                "symbol": symbol,
            }

        bid = float(tick.bid)
        ask = float(tick.ask)
        tick_timestamp = int(tick.time)

        if bid <= 0 or ask <= 0:
            return {
                "allowed": False,
                "status": "INVALID_PRICE",
                "reason": (
                    f"Invalid market price for {symbol}: "
                    f"bid={bid}, ask={ask}"
                ),
                "symbol": symbol,
                "bid": bid,
                "ask": ask,
                "tick_timestamp": tick_timestamp,
            }

        now = time.time()
        tick_age = max(0.0, now - tick_timestamp)

        if tick_age > max_tick_age_seconds:
            return {
                "allowed": False,
                "status": "MARKET_CLOSED",
                "reason": (
                    f"Latest tick is stale: "
                    f"{tick_age:.2f} seconds old."
                ),
                "symbol": symbol,
                "bid": bid,
                "ask": ask,
                "tick_timestamp": tick_timestamp,
                "tick_age_seconds": round(tick_age, 2),
                "max_tick_age_seconds": max_tick_age_seconds,
                "trade_mode": int(info.trade_mode),
            }

        return {
            "allowed": True,
            "status": "MARKET_OPEN",
            "reason": "Fresh executable market data available.",
            "symbol": symbol,
            "bid": bid,
            "ask": ask,
            "tick_timestamp": tick_timestamp,
            "tick_age_seconds": round(tick_age, 2),
            "max_tick_age_seconds": max_tick_age_seconds,
            "trade_mode": int(info.trade_mode),
            "filling_mode": int(info.filling_mode),
            "volume_min": float(info.volume_min),
            "volume_max": float(info.volume_max),
            "volume_step": float(info.volume_step),
        }


    def get_symbol_contract(self, symbol):
        if not self.connect():
            return {}
        info = mt5.symbol_info(symbol)
        if not info:
            return {}
        return {
            "symbol":
                symbol,
            "volume_min":
                float(info.volume_min),
            "volume_max":
                float(info.volume_max),
            "volume_step":
                float(info.volume_step),
            "trade_stops_level":
                int(info.trade_stops_level),
            "trade_freeze_level":
                int(info.trade_freeze_level),
            "point":
                float(info.point),
            "digits":
                int(info.digits),
            "trade_tick_size":
                float(info.trade_tick_size),
            "trade_tick_value":
                float(info.trade_tick_value),
            "trade_contract_size":
                float(info.trade_contract_size),
            "trade_mode":
                int(info.trade_mode),
            "filling_mode":
                int(info.filling_mode),
        }


    def get_position_close_deals(self, position_ticket):
        """
        Return broker closing deals associated with an MT5 position.

        This method is strictly read-only.

        MT5 position.ticket is used as the authoritative
        DEAL_POSITION_ID lookup key.

        Closing deal types:
            - DEAL_ENTRY_OUT
            - DEAL_ENTRY_INOUT
            - DEAL_ENTRY_OUT_BY

        No broker execution operation is performed.
        """

        if position_ticket is None:
            return {
                "success": False,
                "position_ticket": None,
                "deals": [],
                "error": "Position ticket is required.",
            }

        if not self.connect():
            error = mt5.last_error()
            return {
                "success": False,
                "position_ticket": position_ticket,
                "deals": [],
                "error": f"MT5 initialization failed: {error}",
            }

        try:
            deals = mt5.history_deals_get(
                position=int(position_ticket)
            )

            if deals is None:
                error = mt5.last_error()

                return {
                    "success": False,
                    "position_ticket": int(position_ticket),
                    "deals": [],
                    "error": (
                        "MT5 history_deals_get returned None: "
                        f"{error}"
                    ),
                }

            closing_entries = {
                getattr(
                    mt5,
                    "DEAL_ENTRY_OUT",
                    1,
                ),
                getattr(
                    mt5,
                    "DEAL_ENTRY_INOUT",
                    2,
                ),
                getattr(
                    mt5,
                    "DEAL_ENTRY_OUT_BY",
                    3,
                ),
            }

            result = []

            for deal in deals:
                entry = getattr(
                    deal,
                    "entry",
                    None,
                )

                if entry not in closing_entries:
                    continue

                result.append({
                    "ticket": getattr(
                        deal,
                        "ticket",
                        None,
                    ),
                    "order": getattr(
                        deal,
                        "order",
                        None,
                    ),
                    "position_id": getattr(
                        deal,
                        "position_id",
                        None,
                    ),
                    "symbol": getattr(
                        deal,
                        "symbol",
                        "",
                    ),
                    "type": getattr(
                        deal,
                        "type",
                        None,
                    ),
                    "entry": entry,
                    "volume": float(
                        getattr(
                            deal,
                            "volume",
                            0.0,
                        )
                        or 0.0
                    ),
                    "price": float(
                        getattr(
                            deal,
                            "price",
                            0.0,
                        )
                        or 0.0
                    ),
                    "profit": float(
                        getattr(
                            deal,
                            "profit",
                            0.0,
                        )
                        or 0.0
                    ),
                    "swap": float(
                        getattr(
                            deal,
                            "swap",
                            0.0,
                        )
                        or 0.0
                    ),
                    "commission": float(
                        getattr(
                            deal,
                            "commission",
                            0.0,
                        )
                        or 0.0
                    ),
                    "time": getattr(
                        deal,
                        "time",
                        None,
                    ),
                })

            return {
                "success": True,
                "position_ticket": int(position_ticket),
                "deals": result,
                "error": None,
            }

        except Exception as exc:
            return {
                "success": False,
                "position_ticket": int(position_ticket),
                "deals": [],
                "error": str(exc),
            }

    def get_realized_trading_pl(self, start_timestamp=None, end_timestamp=None):
        """
        Return realized trading P/L from MT5 deal history.

        Aggregates trading profit, swap and commission.
        Only BUY and SELL deal types are included.
        """

        if not self.connect():
            return {
                "status": "MT5_NOT_CONNECTED",
                "realized_profit": 0.0,
                "swap": 0.0,
                "commission": 0.0,
                "realized_trading_pl": 0.0,
                "deal_count": 0,
            }

        try:
            import datetime

            if start_timestamp is None:
                start_timestamp = int(
                    (
                        datetime.datetime.now()
                        - datetime.timedelta(days=30)
                    ).timestamp()
                )

            if end_timestamp is None:
                end_timestamp = int(
                    datetime.datetime.now().timestamp()
                )

            start_date = datetime.datetime.fromtimestamp(
                start_timestamp
            )

            end_date = datetime.datetime.fromtimestamp(
                end_timestamp
            )

            deals = mt5.history_deals_get(
                start_date,
                end_date
            )

            if deals is None:
                return {
                    "status": "NO_DEALS",
                    "realized_profit": 0.0,
                    "swap": 0.0,
                    "commission": 0.0,
                    "realized_trading_pl": 0.0,
                    "deal_count": 0,
                }

            realized_profit = 0.0
            swap = 0.0
            commission = 0.0
            deal_count = 0

            buy_type = getattr(
                mt5,
                "DEAL_TYPE_BUY",
                0
            )

            sell_type = getattr(
                mt5,
                "DEAL_TYPE_SELL",
                1
            )

            for deal in deals:
                deal_type = getattr(
                    deal,
                    "type",
                    None
                )

                if deal_type not in (
                    buy_type,
                    sell_type,
                ):
                    continue

                profit = float(
                    getattr(
                        deal,
                        "profit",
                        0.0
                    ) or 0.0
                )

                deal_swap = float(
                    getattr(
                        deal,
                        "swap",
                        0.0
                    ) or 0.0
                )

                deal_commission = float(
                    getattr(
                        deal,
                        "commission",
                        0.0
                    ) or 0.0
                )

                realized_profit += profit
                swap += deal_swap
                commission += deal_commission
                deal_count += 1

            realized_trading_pl = (
                realized_profit
                + swap
                + commission
            )

            return {
                "status": "OK",
                "start_timestamp": start_timestamp,
                "end_timestamp": end_timestamp,
                "realized_profit": round(
                    realized_profit,
                    8
                ),
                "swap": round(
                    swap,
                    8
                ),
                "commission": round(
                    commission,
                    8
                ),
                "realized_trading_pl": round(
                    realized_trading_pl,
                    8
                ),
                "deal_count": deal_count,
            }

        except Exception as exc:
            return {
                "status": "ERROR",
                "error": str(exc),
                "realized_profit": 0.0,
                "swap": 0.0,
                "commission": 0.0,
                "realized_trading_pl": 0.0,
                "deal_count": 0,
            }

mt5_service = MT5Service()


