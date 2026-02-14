$url = "https://volsim-pro.onrender.com/graphql"
$date = Get-Date -Format "yyyy-MM-dd"
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "📡 VOLSIM ENGINE MONITOR ($date)" -ForegroundColor Cyan
Write-Host "Target: $url"
Write-Host "======================================" -ForegroundColor Cyan

while($true) {
    try {
        # Using a timeout of 5 seconds to keep the check snappy
        $response = Invoke-WebRequest -Uri $url -Method Options -TimeoutSec 5 -ErrorAction Stop
        $time = Get-Date -Format "HH:mm:ss"
        Write-Host "[$time] ✅ ENGINE ONLINE" -ForegroundColor Green
    }
    catch {
        $time = Get-Date -Format "HH:mm:ss"
        Write-Host "[$time] 🚨 ENGINE DOWN or SLEEPING!" -ForegroundColor Red
        Write-Host "Hint: Visit the URL in your browser to wake it up." -ForegroundColor Gray
        [console]::beep(800, 500) 
    }
    Start-Sleep -Seconds 30
}
