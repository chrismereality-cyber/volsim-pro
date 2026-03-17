import MetaTrader5 as mt5
import redis, json, time

r = redis.Redis(host='127.0.0.1', port=6379, decode_responses=True)

if not mt5.initialize():
    print("MT5 Init Failed"); quit()

def close_all():
    print("!!! EXECUTING CLOSE ALL !!!")
    positions = mt5.positions_get()
    if not positions: return
    for pos in positions:
        tick = mt5.symbol_info_tick(pos.symbol)
        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "position": pos.ticket,
            "symbol": pos.symbol,
            "volume": pos.volume,
            "type": mt5.ORDER_TYPE_SELL if pos.type == mt5.POSITION_TYPE_BUY else mt5.ORDER_TYPE_BUY,
            "price": tick.bid if pos.type == mt5.POSITION_TYPE_BUY else tick.ask,
            "deviation": 20,
            "magic": 123456,
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }
        mt5.order_send(request)
    r.delete("control_stream") # Clear signal after closing

while True:
    positions = mt5.positions_get()
    if positions:
        # Push current PnL to Redis
        for pos in positions:
            r.xadd("ledger_stream", {"data": json.dumps({"ticket": pos.ticket, "profit": pos.profit})}, maxlen=10)
    
    # Check for commands
    cmd = r.xread({"control_stream": "0"}, count=1)
    if cmd: close_all()
    
    time.sleep(0.5)
