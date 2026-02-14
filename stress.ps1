$API_URL = "https://volsim-pro.onrender.com/v1/open-hedge"
$symbols = "BTCUSD", "ETHUSD", "XAUUSD"

Write-Host "!!! INITIATING AXIOM STRESS TEST: 10 RAPID TRADES !!!" -ForegroundColor Red

foreach ($i in 1..10) {
    $sym = ($symbols | Get-Random)
    $body = @{ 
        symbol = $sym; 
        side = "BUY"; 
        lotSize = (Get-Random -Min 1 -Max 5); 
        openPrice = (Get-Random -Min 50000 -Max 98000); 
        stopLoss = (Get-Random -Min 40000 -Max 49000) 
    } | ConvertTo-Json
    
    try {
        $res = Invoke-RestMethod -Uri $API_URL -Method Post -Body $body -ContentType "application/json"
        # Fixed: space after colon so PowerShell doesn't think it's a drive
        Write-Host "Trade $i : Injected $sym successfully" -ForegroundColor Green
    } catch {
        Write-Host "Trade $i : Failed" -ForegroundColor DarkRed
    }
}
Write-Host "--- Stress Test Complete ---" -ForegroundColor Cyan
