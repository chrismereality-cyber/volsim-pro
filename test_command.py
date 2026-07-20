import redis
import json

# Connect to Redis
r = redis.Redis(host='localhost', port=6380)

# Publish a test order command
command = {
    'action': 'buy',
    'symbol': 'XAUUSDm',
    'volume': 0.1
}

r.publish('trade_commands', json.dumps(command))
print(f'Published command: {command}')
