from pathlib import Path

path = Path("src/components/RiskManagementPanel.tsx")

text = path.read_text()

text = text.replace(
'import React',
'import React\nimport { tradingSocket } from "../../lib/TradingSocketManager";'
)


start = text.find("let ws: WebSocket | null = null;")

if start != -1:

    text = text.replace(
        "let ws: WebSocket | null = null;",
        ""
    )


text = text.replace(
"ws.onopen = () => {",
"// websocket handled by TradingSocketManager\n// ws.onopen = () => {"
)

text = text.replace(
"ws.onmessage = (event) => {",
"// ws.onmessage = (event) => {"
)

text = text.replace(
"ws.onerror = () => {",
"// ws.onerror = () => {"
)

text = text.replace(
"ws.onclose = () => {",
"// ws.onclose = () => {"
)


text = text.replace(
"ws.close();",
"tradingSocket.disconnect();"
)


path.write_text(text)

print("RiskManagementPanel migrated")
