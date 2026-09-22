import {
  TRADING_STATE_WS,
} from "../apiConfig";

import { useTradingStore } from "../store/useTradingStore";

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

let intentionallyClosed = false;

function connect() {
  if (typeof window === "undefined") {
    return;
  }

  if (
    socket &&
    (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    )
  ) {
    return;
  }

  intentionallyClosed = false;

  useTradingStore
    .getState()
    .setConnected(false);

  socket = new WebSocket(TRADING_STATE_WS);

  socket.onopen = () => {
    console.info(
      "[VolSim] Trading state WebSocket connected:",
      TRADING_STATE_WS
    );

    useTradingStore
      .getState()
      .setConnected(true);
  };

  socket.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);

      useTradingStore
        .getState()
        .setTradingState(payload);
    } catch (error) {
      console.error(
        "[VolSim] Invalid trading-state message:",
        error
      );
    }
  };

  socket.onerror = (error) => {
    console.error(
      "[VolSim] Trading state WebSocket error:",
      error
    );

    useTradingStore
      .getState()
      .setConnected(false);
  };

  socket.onclose = () => {
    socket = null;

    useTradingStore
      .getState()
      .setConnected(false);

    if (!intentionallyClosed) {
      reconnectTimer = setTimeout(() => {
        connect();
      }, 3000);
    }
  };
}

export function startTradingStateClient() {
  connect();

  return () => {
    intentionallyClosed = true;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (socket) {
      socket.close();
      socket = null;
    }

    useTradingStore
      .getState()
      .setConnected(false);
  };
}