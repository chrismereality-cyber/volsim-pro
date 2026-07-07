export function connectLiveFeed(onMessage: (data: any) => void) {
  const ws = new WebSocket("ws://localhost:8000/ws/live");

  ws.onmessage = (event) => {
    onMessage(JSON.parse(event.data));
  };

  return ws;
}
