$API_URL = "https://volsim-pro.onrender.com"
$Symbol = "BTCUSD"
$CurrentPrice = 95000.00

# PERSONALITY SETTINGS
$Trend = 0.05       # Positive = Bullish bias, Negative = Bearish bias
$Volatility = 50    # Max "wiggle" per tick
$TurboMult = 1      # Default multiplier

Write-Host ">>> AXIOM MARKET SIMULATOR: ONLINE <<<" -ForegroundColor Cyan
Write-Host "Mode: Mean Reversion + Trend Bias" -ForegroundColor Gray

while($true) {
    try {
        # 1. Fetch live settings from server (Turbo Mode check)
        $status = Invoke-RestMethod -Uri "$API_URL/v1/primary-hedge-status"
        $TurboMult = if ($status.volatilityMultiplier) { $status.volatilityMultiplier } else { 1 }
        
        # 2. Calculate movement
        # (Random Wiggle + Trend Bias) * Turbo
        $Wiggle = (Get-Random -Minimum -$Volatility -Maximum ($Volatility + 1))
        $Bias = ($Trend * $CurrentPrice * 0.001) # Subtle trending pressure
        
        $Change = ($Wiggle + $Bias) * $TurboMult
        $CurrentPrice += $Change

        # 3. Push to Server
        $priceData = @{ prices = @{ "$Symbol" = $CurrentPrice } } | ConvertTo-Json
        Invoke-RestMethod -Uri "$API_URL/v1/update-prices" -Method Post -Body $priceData -ContentType "application/json"

        # 4. Local Display
        $Time = Get-Date -Format "HH:mm:ss"
        $Color = if ($Change -ge 0) { "Green" } else { "Red" }
        Write-Host "[$Time] $Symbol: `$$([Math]::Round($CurrentPrice, 2)) (Move: `$$([Math]::Round($Change, 2))) [x$TurboMult]" -ForegroundColor $Color

    } catch {
        Write-Host "[!] Sync Interrupted - Check Server Status" -ForegroundColor Yellow
    }
    
    Start-Sleep -Seconds 2
}
