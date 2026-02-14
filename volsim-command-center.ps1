function Show-Menu {
    Clear-Host
    Write-Host "==============================================" -ForegroundColor Cyan
    Write-Host "💹 VOLSIM PRO COMMAND CENTER + ALERTS [2026]" -ForegroundColor Cyan
    Write-Host "==============================================" -ForegroundColor Cyan
    Write-Host "1. Run Auto-Wake & Smart Price Alerts" -ForegroundColor Green
    Write-Host "2. One-Key Deploy (Add, Commit, Push)" -ForegroundColor Yellow
    Write-Host "Q. Exit" -ForegroundColor Red
    Write-Host "==============================================" -ForegroundColor Cyan
}

do {
    Show-Menu
    $choice = Read-Host "Select an option"
    switch ($choice) {
        '1' {
            $upper = 92000
            $lower = 82000
            Write-Host "📡 Monitoring ($lower - $upper)... (Ctrl+C to stop)" -ForegroundColor Cyan
            
            while($true) {
                try {
                    $url = "https://volsim-pro.onrender.com/graphql"
                    $response = Invoke-RestMethod -Uri $url -Method Post -Body '{"query":"{ getServer(id: \"1\") { btcPrice } }"}' -ContentType "application/json" -TimeoutSec 15
                    $price = $response.data.getServer.btcPrice
                    $time = Get-Date -Format "HH:mm:ss"

                    if ($price -ge $upper -or $price -le $lower) {
                        # CRITICAL ALERT
                        Write-Host "[$time] 🚨 LIMIT BREACH: `$$price" -ForegroundColor White -BackgroundColor Red
                        [console]::beep(1000, 500)
                        [console]::beep(1200, 500)
                    } else {
                        # STABLE
                        Write-Host "[$time] ✅ Price Stable: `$$price" -ForegroundColor Green
                    }
                } catch {
                    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 🚨 Engine Unreachable" -ForegroundColor Yellow
                }
                Start-Sleep -Seconds 30
            }
        }
        '2' {
            $msg = Read-Host "Enter Commit Message"
            git add .; git commit -m "$msg"; git push origin main
            Write-Host "✅ Pushed to Production." -ForegroundColor Green
            Pause
        }
    }
} until ($choice -eq 'q')
