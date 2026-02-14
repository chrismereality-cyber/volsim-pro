#!/bin/bash

# Array of sample symbols (add more pairs if needed)
symbols=("XAUUSD" "EURUSD" "GBPUSD" "USDJPY" "AUDUSD" "USDCAD")

# Loop through symbols and send new trade POST requests
for i in "${!symbols[@]}"; do
  symbol=${symbols[$i]}
  tradeId="trade$(printf "%03d" $((i+1)))"
  side="BUY"
  price=$(awk -v min=1 -v max=2000 'BEGIN{srand(); print min+rand()*(max-min)}')
  
  echo "Creating trade $tradeId: $symbol $side @ $price"
  
  curl -s -X POST http://localhost:3000/v1/new-trade \
    -H "Content-Type: application/json" \
    -d "{
      \"id\":\"$tradeId\",
      \"symbol\":\"$symbol\",
      \"side\":\"$side\",
      \"lotSize\":1,
      \"price\":$price
    }"
  echo ""
done

# Show current hedge status
echo "=== Hedge Status ==="
curl -s http://localhost:3000/v1/hedge-status | jq
echo ""

# Force close all hedges at a simulated market price
for i in "${!symbols[@]}"; do
  symbol=${symbols[$i]}
  marketPrice=$(awk -v min=1 -v max=2000 'BEGIN{srand(); print min+rand()*(max-min)}')
  echo "Force closing hedge for $symbol at price $marketPrice"
done

curl -s http://localhost:3000/v1/secondary-log | jq
