import { TradingApiClient } from "./TradingApiClient";

type Listener = (payload: any) => void;

type SocketStatus =
    | "CONNECTED"
    | "DISCONNECTED";

export class TradingSocketManager {
    private socket: WebSocket | null = null;
    private listeners: Listener[] = [];

    private endpoint = "/ws/trading-state";

    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    private reconnectDelay = 1000;
    private readonly maxReconnectDelay = 10000;

    private manuallyClosed = false;

    private currentAccessToken: string | null = null;

    connect(
        endpoint: string = "/ws/trading-state",
        accessToken: string,
    ) {
        this.endpoint = endpoint;
        this.manuallyClosed = false;
        this.currentAccessToken = accessToken;

        if (!accessToken) {
            console.error(
                "[VOLSIM] WebSocket authentication token is missing"
            );
            return;
        }

        if (typeof window === "undefined") {
            return;
        }

        if (
            this.socket &&
            (
                this.socket.readyState === WebSocket.OPEN ||
                this.socket.readyState === WebSocket.CONNECTING
            )
        ) {
            return;
        }

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        const wsUrl = TradingApiClient.ws(this.endpoint);

        console.log(
            `[VOLSIM] Connecting to shared trading state: ${wsUrl}`
        );

        const socket = new WebSocket(wsUrl);

        this.socket = socket;

        socket.onopen = () => {
            if (this.socket !== socket) {
                socket.close();
                return;
            }

            console.log(
                "[VOLSIM] Global Trading State Connected"
            );

            this.reconnectDelay = 1000;

            socket.send(
                JSON.stringify({
                    type: "authenticate",
                    token: accessToken,
                })
            );

        };

        socket.onmessage = (event) => {
            if (this.socket !== socket) {
                return;
            }

            try {
                const payload = JSON.parse(event.data);

                this.emit(payload);
            } catch (error) {
                console.error(
                    "[VOLSIM] Invalid WebSocket payload",
                    error
                );
            }
        };

        socket.onerror = (error) => {
            console.error(
                "[VOLSIM] WebSocket Error",
                error
            );
        };

        socket.onclose = (event) => {
            const eventCode = event.code;
            const eventReason = event.reason;
            if (this.socket === socket) {
                this.socket = null;
            }

            console.log(
                `[VOLSIM] Global Trading State Closed | code=${eventCode} | reason=${eventReason}`
            );

            this.emit({
                __socket_status: "DISCONNECTED" as SocketStatus
            });

            if (!this.manuallyClosed) {
                this.scheduleReconnect();
            }
        };
    }

    private emit(payload: any) {
        this.listeners.forEach((listener) => {
            try {
                listener(payload);
            } catch (error) {
                console.error(
                    "[VOLSIM] Trading state listener error",
                    error
                );
            }
        });
    }

    private scheduleReconnect() {
        if (
            this.manuallyClosed ||
            this.reconnectTimer
        ) {
            return;
        }

        const delay = this.reconnectDelay;

        console.log(
            `[VOLSIM] Reconnecting in ${delay}ms`
        );

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;

            if (this.manuallyClosed) {
                return;
            }

            if (this.currentAccessToken) {
                this.connect(this.endpoint, this.currentAccessToken);
            }

            this.reconnectDelay = Math.min(
                this.reconnectDelay * 2,
                this.maxReconnectDelay
            );
        }, delay);
    }

    subscribe(listener: Listener) {
        this.listeners.push(listener);

        return () => {
            this.listeners = this.listeners.filter(
                (item) => item !== listener
            );
        };
    }

    disconnect() {
        this.manuallyClosed = true;
        this.currentAccessToken = null;

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        const socket = this.socket;

        this.socket = null;

        if (socket) {
            socket.close();
        }

        console.log(
            "[VOLSIM] Global Trading State Manager Disconnected"
        );
    }
}

export const tradingSocket =
    new TradingSocketManager();



