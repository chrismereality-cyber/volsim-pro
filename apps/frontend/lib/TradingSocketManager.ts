import { TradingApiClient } from "./TradingApiClient";

type Listener = (payload: any) => void;

export class TradingSocketManager {
    private socket: WebSocket | null = null;

    private listeners: Listener[] = [];

    private endpoint = "/ws/trading-state";

    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    private reconnectDelay = 1000;

    private maxReconnectDelay = 10000;

    private manuallyClosed = false;

    connect(
        endpoint: string = "/ws/trading-state"
    ) {
        this.endpoint = endpoint;
        this.manuallyClosed = false;

        if (
            this.socket &&
            (
                this.socket.readyState === WebSocket.OPEN ||
                this.socket.readyState === WebSocket.CONNECTING
            )
        ) {
            return;
        }

        if (typeof window === "undefined") {
            return;
        }

        console.log(
            `[VOLSIM] Connecting to ${TradingApiClient.ws(this.endpoint)}`
        );

        this.socket = new WebSocket(
            TradingApiClient.ws(this.endpoint)
        );

        this.socket.onopen = () => {
            console.log(
                "[VOLSIM] Global Trading State Connected"
            );

            this.reconnectDelay = 1000;

            this.listeners.forEach(listener => {
                try {
                    listener({
                        __socket_status: "CONNECTED"
                    });
                } catch (error) {
                    console.error(
                        "[VOLSIM] Socket status listener error",
                        error
                    );
                }
            });
        };

        this.socket.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);

                this.listeners.forEach(listener => {
                    try {
                        listener(payload);
                    } catch (error) {
                        console.error(
                            "[VOLSIM] Listener error",
                            error
                        );
                    }
                });
            } catch (error) {
                console.error(
                    "[VOLSIM] Invalid WebSocket payload",
                    error
                );
            }
        };

        this.socket.onerror = (error) => {
            console.error(
                "[VOLSIM] WebSocket Error",
                error
            );
        };

        this.socket.onclose = () => {
            console.log(
                "[VOLSIM] Global Trading State Closed"
            );

            this.socket = null;

            this.listeners.forEach(listener => {
                try {
                    listener({
                        __socket_status: "DISCONNECTED"
                    });
                } catch (error) {
                    console.error(
                        "[VOLSIM] Disconnect listener error",
                        error
                    );
                }
            });

            if (!this.manuallyClosed) {
                this.scheduleReconnect();
            }
        };
    }

    private scheduleReconnect() {
        if (this.reconnectTimer) {
            return;
        }

        console.log(
            `[VOLSIM] Reconnecting in ${this.reconnectDelay}ms`
        );

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;

            this.connect(
                this.endpoint
            );

            this.reconnectDelay = Math.min(
                this.reconnectDelay * 2,
                this.maxReconnectDelay
            );
        }, this.reconnectDelay);
    }

    subscribe(
        listener: Listener
    ) {
        this.listeners.push(listener);

        return () => {
            this.listeners =
                this.listeners.filter(
                    item => item !== listener
                );
        };
    }

    disconnect() {
        this.manuallyClosed = true;

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.socket) {
            this.socket.close();
        }

        this.socket = null;
    }
}

export const tradingSocket =
    new TradingSocketManager();
