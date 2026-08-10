import redis
import json
import MetaTrader5 as mt5

# Configuration
REDIS_HOST = 'localhost'
REDIS_PORT = 6380
ORDER_CHANNEL = 'trade_orders'

def execute_trade(order_data):
    symbol = order_data['symbol']
    action = order_data['action'] # 'BUY' or 'SELL'

    # MT5 Order Request Structure
    tick = mt5.symbol_info_tick(symbol)
    price = tick.ask if action == 'BUY' else tick.bid

    request = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": symbol,
        "volume": 0.01,
        "type": mt5.ORDER_TYPE_BUY if action == 'BUY' else mt5.ORDER_TYPE_SELL,
        "price": price,
        "deviation": 20,
        "magic": 123456,
        "comment": "Trade from Execution Service",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }

    result = mt5.order_send(request)
    print(f'Order sent for {symbol}: {result.retcode}')
    return result

def main():
    if not mt5.initialize():
        print('MT5 Init Failed')
        return

    r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0, decode_responses=True)
    pubsub = r.pubsub()
    pubsub.subscribe(ORDER_CHANNEL)

    print(f'Execution Service listening on {ORDER_CHANNEL}...')

    for message in pubsub.listen():
        if message['type'] == 'message':
            order_data = json.loads(message['data'])
            print(f'Received order: {order_data}')
            execute_trade(order_data)

if __name__ == '__main__':
    main()
