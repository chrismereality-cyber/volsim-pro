
import { TradingApiClient } from "./TradingApiClient";


type Listener = (payload: any) => void;


export class TradingSocketManager {

    private socket: WebSocket | null = null;

    private listeners: Listener[] = [];


    connect(
        endpoint: string = "/ws/trading-state",
        callback?: Listener
    ) {

        if (callback) {
            this.listeners.push(callback);
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


        this.socket = new WebSocket(
            TradingApiClient.ws(endpoint)
        );


        this.socket.onopen = () => {

            console.log(
                "[VOLSIM] Global Trading State Connected"
            );

        };


        this.socket.onmessage = (event) => {

            const payload = JSON.parse(
                event.data
            );


            this.listeners.forEach(
                listener => listener(payload)
            );

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

        };


    }



    subscribe(
        listener: Listener
    ) {


        this.listeners.push(
            listener
        );


        return () => {

            this.listeners =
                this.listeners.filter(
                    item => item !== listener
                );

        };

    }



    disconnect() {


        if(this.socket) {

            this.socket.close();

        }


        this.socket = null;

        this.listeners = [];

    }


}



export const tradingSocket =
new TradingSocketManager();
