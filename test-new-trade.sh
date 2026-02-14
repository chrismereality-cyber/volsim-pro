#!/bin/bash

# Test new trades on Volsim API

BASE_URL="http://localhost:3000"

# Trade 1: XAUUSD
curl -s -X POST $BASE_URL/v1/new-trade \
  -H "Content-Type: application/json" \
  -d '{
    "id":"trade001",
    "symbol":"XAUUSD",
    "side":"BUY",
    "lotSize":1,
    "price":1930
  }'
echo -e "\n"

# Trade 2: EURUSD
curl -s -X POST $BASE_URL/v1/new-trade \
  -H "Content-Type: application/json" \
  -d '{
    "id":"trade002",
    "symbol":"EURUSD",
    "side":"SELL",
    "lotSize":1,
    "price":1.095
  }'
echo -e "\n"

# Show current hedge status
echo "Hedge Status:"
curl -s $BASE_URL/v1/hedge-status
echo -e "\n"

# Force close all hedges at market price
echo "Force closing all hedges at current market prices..."
curl -s -X POST $BASE_URL/v1/close-trade \
  -H "Content-Type: application/json" \
  -d '{
    "tradeId":"trade001",
    "closePrice":1935,
    "profit":5
  }'
curl -s -X POST $BASE_URL/v1/close-trade \
  -H "Content-Type: application/json" \
  -d '{
    "tradeId":"trade002",
    "closePrice":1.100,
    "profit":0.005
  }'
echo -e "\n"

# Show secondary account log
echo "Secondary Account Log:"
curl -s $BASE_URL/v1/secondary-log
echo -e "\n"
