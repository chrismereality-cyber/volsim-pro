import numpy as np
import time
import sys
import redis
import json
import os

class RiskEngine:
    def __init__(self):
        self.redis_client = redis.Redis(host=os.getenv('REDIS_HOST', 'localhost'), port=6379, db=0)
        self.pubsub = self.redis_client.pubsub()
        self.pubsub.subscribe('market_data')
        
    def run(self):
        print("Risk Worker initialized and listening on 'market_data'...", file=sys.stdout, flush=True)
        for message in self.pubsub.listen():
            if message['type'] == 'message':
                data = json.loads(message['data'])
                print(f"Received market update: {data}", file=sys.stdout, flush=True)
                # Here you will soon trigger your calculate_position_metrics

if __name__ == "__main__":
    engine = RiskEngine()
    engine.run()
