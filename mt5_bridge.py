import MetaTrader5 as mt5
import redis
import json
import time
from concurrent.futures import ThreadPoolExecutor

# Configuration
SYMBOLS = ['XAUUSDm', 'EURUSD', 'GBPUSD']
REDIS_HOST = 'localhost'
REDIS_PORT = 6380

def get_redis():
    return redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0, decode_responses=True)

def update_symbol_data(symbol, r):
    tick = mt5.symbol_info_tick(symbol)
    if tick:
        payload = {'bid': tick.bid, 'ask': tick.ask, 'timestamp': time.time()}
        r.set(f'tick:{symbol}', json.dumps(payload))
        return True
    return False

def main():
    if not mt5.initialize():
        print("MT5 Init Failed")
        return

    # Initialize all symbols
    for s in SYMBOLS:
        mt5.symbol_select(s, True)

    r = get_redis()
    print(f"Bridge active for: {SYMBOLS}")

    try:
        while True:
            # Update all symbols in the pool
            with ThreadPoolExecutor(max_workers=len(SYMBOLS)) as executor:
                results = list(executor.map(lambda s: update_symbol_data(s, r), SYMBOLS))

            r.set('bridge:status', 'active', ex=10)
            time.sleep(0.5) # Higher frequency updates
    except KeyboardInterrupt:
        mt5.shutdown()
        print("Bridge stopped.")

if __name__ == '__main__':
    main()
