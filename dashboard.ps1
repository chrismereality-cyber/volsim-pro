$API_URL = "http://localhost:3000"
while ($true) {
    Clear-Host
    Write-Host "=== VOLSIM LIVE TERMINAL ===" -ForegroundColor Cyan
    try {
        $primary = Invoke-RestMethod -Uri "$API_URL/v1/primary-hedge-status" -ErrorAction Stop
        $primary | Format-Table id, symbol, side, lotSize, openPrice, profit
    }
    catch {
        Write-Host "Waiting for API connection at $API_URL..." -ForegroundColor Gray
    }
    Start-Sleep -Seconds 1
}
