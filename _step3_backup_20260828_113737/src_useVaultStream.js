import { useEffect, useState } from "react";

export default function useVaultStream() {
  const [data, setData] = useState(null);

  useEffect(() => {
    import { WS_BASE } from '../apiConfig'; const ws = new WebSocket(\\/ws/vault\);

    ws.onmessage = (event) => {
      setData(JSON.parse(event.data));
    };

    return () => ws.close();
  }, []);

  return data;
}
