$url = "https://volsim-pro.onrender.com/graphql"
$wakeQuery = '{"query":"{ getServer(id: \"1\") { name btcPrice } }"}'

Write-Host "🚀 VOLSIM PRO: Smart Auto-Wake Monitor Active" -ForegroundColor Cyan
Write-Host "Target: $url"

while($true) {
    try {
        # Attempt a lightweight ping first
        $ping = Invoke-WebRequest -Uri $url -Method Options -TimeoutSec 5 -ErrorAction Stop
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ✅ Engine Warm" -ForegroundColor Green
    }
    catch {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 💤 Engine Sleeping. Sending Wake-Up Call..." -ForegroundColor Yellow
        try {
            # Send a real POST request to force a cold start
            $wake = Invoke-RestMethod -Uri $url -Method Post -Body $wakeQuery -ContentType "application/json" -TimeoutSec 30
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ✨ Engine Awoken! BTC Price: $($wake.data.getServer.btcPrice)" -ForegroundColor Cyan
        }
        catch {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ❌ Critical Error: Could not wake engine." -ForegroundColor Red
            [console]::beep(800, 500)
        }
    }
    Start-Sleep -Seconds 60
}
