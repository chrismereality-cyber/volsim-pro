import redis
import json
import time
import psycopg2
from collections import deque

# Configuration
REDIS_KEY = 'tick:XAUUSDm'
WINDOW_SIZE = 10
# Replace with your actual DB credentials
DB_CONFIG = "dbname=volsim_db user=postgres password=yourpassword host=localhost port=5432"

r = redis.Redis(host='localhost', port=6380, db=0, decode_responses=True)

def log_to_postgres(price, signal):
    try:
        conn = psycopg2.connect(DB_CONFIG)
        cur = conn.cursor()
        cur.execute(
            'INSERT INTO market_signals (symbol, price, signal, created_at) VALUES (%s, %s, %s, NOW())',
            ('XAUUSDm', price, signal)
        )
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f'DB Error: {e}')

def calculate_signal(price_history):
    if len(price_history) < WINDOW_SIZE:
        return 'INSUFFICIENT_DATA'
    avg = sum(price_history) / len(price_history)
    latest = price_history[-1]
    if latest > avg: return 'BULLISH'
    elif latest < avg: return 'BEARISH'
    return 'NEUTRAL'

def main():
    price_history = deque(maxlen=WINDOW_SIZE)
    print(f'Regime Engine active. Logging to Postgres...')

    while True:
        data = r.get(REDIS_KEY)
        if data:
            tick = json.loads(data)
            mid_price = (tick['bid'] + tick['ask']) / 2
            price_history.append(mid_price)

            signal = calculate_signal(price_history)
            if signal != 'INSUFFICIENT_DATA':
                log_to_postgres(mid_price, signal)
                print(f'Price: {mid_price:.3f} | Signal: {signal} | Logged')

        time.sleep(1)

if __name__ == '__main__':
    main()
