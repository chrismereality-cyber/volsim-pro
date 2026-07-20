import asyncio
import httpx
import websockets
import json

async def trigger_handshake():
    uri = 'ws://localhost:8080/ws/risk-state'
    async with websockets.connect(uri) as websocket:
        # Simulate the Core Risk Engine coming online
        data = {
            'type': 'GLOBAL_UPDATE',
            'data': {
                'risk': {
                    'current_drawdown': 0.0,
                    'margin_usage': 0.0,
                    'risk_score': 0.0
                }
            }
        }
        print('Sending handshake payload...')
        await websocket.send(json.dumps(data))
        print('Handshake delivered.')

if __name__ == '__main__':
    asyncio.run(trigger_handshake())
