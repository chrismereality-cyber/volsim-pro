import { useEffect, useState } from "react";

export function useTradingTerminal() {
  const [trades, setTrades] = useState([]);
  const [pnl, setPnl] = useState(0);
  const [price, setPrice] = useState(null);
  const [orderbook, setOrderbook] = useState(null);

  useEffect(() => {
    const ws = new WebSocket("ws://127.0.0.1:8000/ws/dashboard");

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case "trade_update":
          setTrades((t) => [...t, msg.data]);
          break;

        case "pnl_update":
          setPnl(msg.data.total_pnl);
          break;

        case "price_tick":
          setPrice(msg.price);
          break;

        case "orderbook":
          setOrderbook(msg.data);
          break;
      }
    };

    return () => ws.close();
  }, []);

  return { trades, pnl, price, orderbook };
}
