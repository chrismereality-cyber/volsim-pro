from fastapi import APIRouter, WebSocket

router = APIRouter()

@router.websocket("/trading-state")
async def websocket_trading_state(websocket: WebSocket):
    await websocket.accept()
    # Add your trading logic here
