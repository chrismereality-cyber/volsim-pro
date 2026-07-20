import redis
import json

# Updated to use port 6380 to match the new docker-compose mapping
r = redis.Redis(host='localhost', port=6380, db=0)
test_data = {"symbol": "XAUUSDm", "price": 2450.50, "volume": 1.0}
r.publish('market_data', json.dumps(test_data))
print('Message published to Redis on port 6380')
