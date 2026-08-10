import MetaTrader5 as mt5


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


    def get_account_info(self):

        if not self.connect():
            return {}

        account = mt5.account_info()

        if not account:
            return {}

        return {
            "balance": account.balance,
            "equity": account.equity,
            "margin": account.margin,
            "free_margin": account.margin_free,
            "leverage": account.leverage,
            "currency": account.currency
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
            "leverage": account.get("leverage", 100)
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


mt5_service = MT5Service()
