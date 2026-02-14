#!/bin/bash

API="http://localhost:3000"
INTERVAL=1

safe_fetch() {
  raw=$(curl -s --max-time 1 "$1")
  echo "$raw" | jq -e . >/dev/null 2>&1 && echo "$raw" || echo "[]"
}

sum_profits() {
  jq '[.[]?.profit // 0] | add // 0'
}

color() {
  v=$1
  if awk "BEGIN{exit !($v>0)}"; then
    echo -e "\033[32m$v\033[0m"
  elif awk "BEGIN{exit !($v<0)}"; then
    echo -e "\033[31m$v\033[0m"
  else
    echo -e "\033[33m$v\033[0m"
  fi
}

while true; do
  clear
  echo "=== VOLSIM LIVE DASHBOARD ==="
  echo "Time: $(date)"
  echo

  PRIMARY=$(safe_fetch "$API/v1/primary-hedge-status")
  SECONDARY=$(safe_fetch "$API/v1/secondary-hedge-status")
  LOG=$(safe_fetch "$API/v1/secondary-log")

  echo "--- PRIMARY HEDGES ---"
  echo "$PRIMARY" | jq -r '.[]? | "\(.symbol)\t\(.side)\tLot:\(.lotSize)\tP/L:\(.profit)"' \
    || echo "No primary hedges"

  echo
  echo "--- SECONDARY HEDGES ---"
  echo "$SECONDARY" | jq -r '.[]? | "\(.symbol)\t\(.side)\tLot:\(.lotSize)\tP/L:\(.profit)"' \
    || echo "No secondary hedges"

  echo
  echo "--- SECONDARY ACCOUNT LOG ---"
  echo "$LOG" | jq -r '.[]? | "\(.symbol)\t\(.side)\tLot:\(.lotSize)\tP/L:\(.profit)"' \
    || echo "No secondary logs"

  TP=$(echo "$PRIMARY" | sum_profits)
  TS=$(echo "$SECONDARY" | sum_profits)
  GT=$(awk "BEGIN{print $TP+$TS}")

  echo
  echo "=== SUMMARY ==="
  echo "Primary P/L   : $(color "$TP")"
  echo "Secondary P/L : $(color "$TS")"
  echo "TOTAL P/L     : $(color "$GT")"

  sleep "$INTERVAL"
done
