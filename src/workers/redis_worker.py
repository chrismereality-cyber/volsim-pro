import asyncio
import redis.asyncio as redis
import asyncpg
import json
import os
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

# Configuration
REDIS_URL = os.getenv('REDIS_URL')
DATABASE_URL = os.getenv('DATABASE_URL')
QUEUE_NAME = 'trade_events'

# Validation
if not REDIS_URL:
    raise ValueError("REDIS_URL is not set. Please set it (e.g., 'redis://localhost:6379')")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set. Ensure it is defined in .env")

async def process_events():
    # Setup connections
    print(f'Connecting to Redis at {REDIS_URL.split("@")[-1] if "@" in REDIS_URL else "local"}...')
    r = redis.from_url(REDIS_URL, decode_responses=True)

    print('Connecting to Supabase...')
    conn = await asyncpg.connect(DATABASE_URL)

    print(f'Worker started. Listening on {QUEUE_NAME}...')

    try:
        while True:
            # BLPOP blocks until an item is available in the list
            # Returns a tuple: (queue_name, data)
            queue_data = await r.blpop(QUEUE_NAME)

            if queue_data:
                _, message = queue_data
                try:
                    data = json.loads(message)

                    # Persist to Supabase
                    await conn.execute('''
                        INSERT INTO trade_events (symbol, side, volume, price, timestamp)
                        VALUES (, , , , )
                    ''', data['symbol'], data['side'], data['volume'], data['price'], data['timestamp'])

                    print(f'Successfully logged trade: {data["symbol"]} {data["side"]}')

                except Exception as e:
                    print(f'Error processing message: {e}')

    finally:
        await conn.close()
        await r.close()

if __name__ == '__main__':
    try:
        asyncio.run(process_events())
    except KeyboardInterrupt:
        print('\nWorker stopped by user.')
