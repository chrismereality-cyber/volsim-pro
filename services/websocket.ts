export class TradingSocket {

    socket: WebSocket | null = null;

    connect(onMessage?: (data: any) => void) {

        this.socket = new WebSocket("ws://localhost:8000/broker/live");

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("LIVE UPDATE:", data);

            if (onMessage) onMessage(data);
        };
    }

    send(msg: any) {
        this.socket?.send(JSON.stringify(msg));
    }

    disconnect() {
        this.socket?.close();
    }
}
