#!/bin/bash

# Clear previous trades / logs (optional, only for testing)
curl -X POST http://localhost:3000/v1/clear-data

# Define trades (multiple symbols)
TRADES='[
  {"id":"trade001","symbol":"XAUUSD","side":"BUY","lotSize":1,"price":1930},
  {"id":"trade002","symbol":"EURUSD","side":"SELL","lotSize":1,"price":1.095},
  {"id":"trade003","symbol":"GBPUSD","side":"SELL","lotSize":1,"price":1.519},
  {"id":"trade004","symbol":"USDJPY","side":"BUY","lotSize":1,"price":148.8},
  {"id":"trade005","symbol":"AUDUSD","side":"SELL","lotSize":1,"price":0.713},
  {"id":"trade006","symbol":"USDCAD","side":"BUY","lotSize":1,"price":1.232}
]'

# Post each trade to /v1/new-trade
for row in $(echo "${TRADES}" | jq -c '.[]'); do
  curl -s -X POST http://localhost:3000/v1/new-trade \
    -H "Content-Type: application/json" \
    -d "$row"
  echo ""
done

# Fetch current hedge status
echo "================ Hedge Status ================"
curl -s http://localhost:3000/v1/hedge-status | jq

# Fetch secondary account log
echo "============= Secondary Account Log ============="
curl -s http://localhost:3000/v1/secondary-log | jq

