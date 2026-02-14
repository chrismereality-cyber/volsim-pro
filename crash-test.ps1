$API_URL = "https://volsim-pro.onrender.com/v1/open-hedge"
Write-Host "!!! AGGRESSOR SCRIPT READY: STANDBY FOR CRASH NEWS !!!" -ForegroundColor Cyan

foreach ($i in 1..20) {
    $body = @{ 
        symbol = "BTCUSD"; 
        side = "BUY"; 
        lotSize = 10; 
        openPrice = 95000; 
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri $API_URL -Method Post -Body $body -ContentType "application/json"
        Write-Host "Trade $i : BYPASSED DEFENSE! (FAILURE)" -ForegroundColor Red
    } catch {
        Write-Host "Trade $i : BLOCKED BY AXIOM (SUCCESS)" -ForegroundColor Green
    }
}
