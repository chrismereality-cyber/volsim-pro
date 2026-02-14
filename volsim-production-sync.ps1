$renderUrl = "https://volsim-pro.onrender.com/graphql"
$vercelUrl = "https://volsim-ui.vercel.app"
$query = '{"query":"{ getServer(id: \"1\") { name btcPrice upperLimit } }"}'

function Show-Header {
    Clear-Host
    Write-Host "==============================================" -ForegroundColor Cyan
    Write-Host "🚀 VOLSIM PRO PRODUCTION SYNC [JAN 2026]" -ForegroundColor Cyan
    Write-Host "==============================================" -ForegroundColor Cyan
}

while($true) {
    Show-Header
    try {
        # 1. Wake and Fetch Data
        $start = Get-Date
        $response = Invoke-RestMethod -Uri $renderUrl -Method Post -Body $query -ContentType "application/json" -TimeoutSec 20
        $end = Get-Date
        $latency = [math]::Round(($end - $start).TotalMilliseconds)

        $btc = $response.data.getServer.btcPrice
        $limit = $response.data.getServer.upperLimit

        Write-Host "📡 BACKEND (Render): ONLINE" -ForegroundColor Green
        Write-Host "⏱️  Latency:         $latency ms"
        Write-Host "💹 BTC Price:       `$$btc" -ForegroundColor Yellow
        Write-Host "📈 Upper Limit:     `$$limit"
    }
    catch {
        Write-Host "🚨 BACKEND (Render): SLEEPING or OFFLINE" -ForegroundColor Red
        Write-Host "Attempting to force wake-up..." -ForegroundColor Gray
        [console]::beep(400, 200)
    }

    Write-Host "----------------------------------------------"
    Write-Host "🌍 FRONTEND (Vercel): $vercelUrl" -ForegroundColor Gray
    Write-Host "----------------------------------------------"
    Write-Host "Next check in 5 minutes (keeps Render awake)..."
    
    # Render spins down after 15 mins. Checking every 5 mins (300s) keeps it alive.
    Start-Sleep -Seconds 300
}
