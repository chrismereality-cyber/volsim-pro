from fastapi import WebSocket
from typing import Dict, List

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, channel: str):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = []
        if websocket not in self.active_connections[channel]:
            self.active_connections[channel].append(websocket)

    def disconnect(self, websocket: WebSocket, channel: str):
        if channel in self.active_connections and websocket in self.active_connections[channel]:
            self.active_connections[channel].remove(websocket)

    async def broadcast_global_state(self, message: dict):
        for channel in self.active_connections:
            for connection in self.active_connections[channel]:
                try:
                    await connection.send_json({'type': 'GLOBAL_UPDATE', 'data': message})
                except:
                    # Ignore failures for disconnected clients
                    pass

manager = ConnectionManager()
