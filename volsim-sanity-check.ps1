$renderUrl = "https://volsim-pro.onrender.com/graphql"
$vercelUrl = "https://volsim-ui.vercel.app"

function Test-Endpoint($name, $url) {
    Write-Host "🔍 Testing $name..." -NoNewline
    try {
        $start = Get-Date
        $res = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 10 -ErrorAction Stop
        $end = Get-Date
        $time = [math]::Round(($end - $start).TotalMilliseconds)
        Write-Host " [OK] " -ForegroundColor Green -NoNewline
        Write-Host "($time ms)" -ForegroundColor Gray
        return $true
    } catch {
        Write-Host " [FAILED]" -ForegroundColor Red
        return $false
    }
}

Clear-Host
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "🛡️  VOLSIM PRO PRODUCTION SANITY CHECK" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

$rStatus = Test-Endpoint "BACKEND (Render)" $renderUrl
$vStatus = Test-Endpoint "FRONTEND (Vercel)" $vercelUrl

Write-Host "----------------------------------------------"

if ($rStatus -and $vStatus) {
    Write-Host "🔹 Testing Connection Handshake..." -NoNewline
    try {
        $query = '{"query":"{ getServer(id: \"1\") { btcPrice } }"}'
        $handshake = Invoke-RestMethod -Uri $renderUrl -Method Post -Body $query -ContentType "application/json" -TimeoutSec 15
        if ($handshake.data.getServer.btcPrice) {
            Write-Host " [SUCCESS]" -ForegroundColor Green
            Write-Host "`n✅ YOUR ECOSYSTEM IS FULLY CONNECTED!" -ForegroundColor White -BackgroundColor Green
        }
    } catch {
        Write-Host " [ERROR]" -ForegroundColor Red
        Write-Host "❌ Backend is up, but GraphQL is failing. Check Render logs." -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ One or more services are unreachable." -ForegroundColor Red
    Write-Host "Check if Render is sleeping or if Vercel deployment finished." -ForegroundColor Gray
}

Write-Host "==============================================" -ForegroundColor Cyan
