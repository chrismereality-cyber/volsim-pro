from pathlib import Path

path = Path("components/views/RegimeRobustnessView.tsx")

text = path.read_text()


text=text.replace(
'import React',
'import React\nimport { tradingSocket } from "../../lib/TradingSocketManager";'
)


text=text.replace(
"ws.onopen = () => setConnected(true);",
"tradingSocket.connect('/ws/trading-state', () => setConnected(true));"
)


text=text.replace(
"ws.onmessage = (event) => {",
"tradingSocket.connect('/ws/trading-state', (event:any) => {"
)


text=text.replace(
"ws.onclose = () => setConnected(false);",
"tradingSocket.disconnect();"
)


path.write_text(text)

print("RegimeRobustness migrated")
