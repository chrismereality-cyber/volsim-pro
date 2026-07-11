from fastapi import APIRouter, WebSocket
import asyncio

router = APIRouter()

@router.websocket("/trading-state")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Persistent connection loop
            await websocket.send_json({"status": "active", "message": "handshake_confirmed"})
            await asyncio.sleep(1)
    except Exception as e:
        print(f"Connection closed: {e}")
