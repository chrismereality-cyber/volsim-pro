# Check port 3000 instead of 3001
$port = 3000
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($process) { 
    Stop-Process -Id $process.OwningProcess -Force 
    Write-Host "Cleared Port $port" -ForegroundColor Green
}

Write-Host "?? Starting Binance Engine (Port 3000)..." -ForegroundColor Cyan
cd "C:\Users\hp\Documents\volsim-api-main"
# Using -NoExit so we can see any errors if it crashes
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node server.js"

Start-Sleep -s 3

Write-Host "?? Starting Ngrok Bridge..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http 3000"

Write-Host "? TERMINAL READY!" -ForegroundColor Green
