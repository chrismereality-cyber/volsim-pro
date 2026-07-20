import MetaTrader5 as mt5
import redis
import json
import time
import threading

# Configuration
r = redis.Redis(host='localhost', port=6380)
MAX_LATENCY = 5.0
last_tick_time = 0

def get_symbol_constraints(symbol):
    info = mt5.symbol_info(symbol)
    return {
        'min_vol': info.volume_min,
        'step': info.volume_step,
        'point': info.point
    }

def monitor_order(ticket):
    # Poll for up to 10 seconds to confirm order status
    for _ in range(20):
        pos = mt5.positions_get(ticket=ticket)
        if pos:
            r.publish('trade_status', json.dumps({'ticket': ticket, 'status': 'FILLED'}))
            return
        time.sleep(0.5)
    r.publish('trade_status', json.dumps({'ticket': ticket, 'status': 'TIMEOUT'}))

def execute_order(cmd):
    global last_tick_time
    if (time.time() - last_tick_time) > MAX_LATENCY:
        return {'status': 'REJECTED', 'reason': 'STALE_DATA'}

    symbol = cmd.get('symbol')
    # Validate constraints
    constraints = get_symbol_constraints(symbol)
    volume = max(constraints['min_vol'], float(cmd.get('volume', 0.1)))
    
    tick = mt5.symbol_info_tick(symbol)
    price = tick.ask if cmd['action'] == 'buy' else tick.bid
    
    request = {
        'action': mt5.TRADE_ACTION_DEAL,
        'symbol': symbol,
        'volume': volume,
        'type': mt5.ORDER_TYPE_BUY if cmd['action'] == 'buy' else mt5.ORDER_TYPE_SELL,
        'price': price,
        'sl': price - (500 * constraints['point']) if cmd['action'] == 'buy' else price + (500 * constraints['point']),
        'magic': 123456,
        'type_filling': mt5.ORDER_FILLING_IOC,
    }
    
    result = mt5.order_send(request)
    if result.retcode == mt5.TRADE_RETCODE_DONE:
        threading.Thread(target=monitor_order, args=(result.order,)).start()
        return {'status': 'SENT', 'ticket': result.order}
    return {'status': 'FAILED', 'reason': result.comment}

def command_listener():
    pubsub = r.pubsub()
    pubsub.subscribe('trade_commands')
    for message in pubsub.listen():
        if message['type'] == 'message':
            result = execute_order(json.loads(message['data']))
            r.publish('trade_results', json.dumps(result))

def main():
    global last_tick_time
    if not mt5.initialize(): return
    
    threading.Thread(target=command_listener, daemon=True).start()
    
    while True:
        tick = mt5.symbol_info_tick('XAUUSDm')
        if tick:
            last_tick_time = time.time()
            r.publish('market_data', json.dumps({'price': tick.bid}))
            # Bridge Health Heartbeat
            r.set('bridge_heartbeat', last_tick_time)
        time.sleep(1)

if __name__ == '__main__':
    main()
