from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio

router = APIRouter()

@router.websocket("/vault-state")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await websocket.send_json({"status": "active"})
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        print("Vault WebSocket: Client disconnected")
    except Exception as e:
        print(f"Vault WebSocket error: {e}")
