import asyncio
from fastapi import WebSocket, WebSocketDisconnect

@app.websocket("/ws/trading-state")
async def trading_state_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Pull live telemetry data to stream to client
            payload = {
                "status": "online",
                "timestamp": asyncio.get_event_loop().time()
            }
            await websocket.send_json(payload)
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        print("Client disconnected from trading-state WebSocket")
