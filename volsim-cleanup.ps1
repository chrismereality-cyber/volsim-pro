$targetPath = "C:\Users\hp\volsim-pro"

function Show-Header {
    Clear-Host
    Write-Host "==============================================" -ForegroundColor Cyan
    Write-Host "🧹 VOLSIM PRO WORKSPACE CLEANUP [2026]" -ForegroundColor Cyan
    Write-Host "==============================================" -ForegroundColor Cyan
}

Show-Header
Write-Host "Scanning for junk files..." -ForegroundColor Gray

# Define what to clean
$filesToDelete = Get-ChildItem -Path $targetPath -Include *.log, *.zip, *.tmp, npm-debug.log* -Recurse -Force

if ($filesToDelete.Count -gt 0) {
    Write-Host "Found $($filesToDelete.Count) files to remove." -ForegroundColor Yellow
    foreach ($file in $filesToDelete) {
        Write-Host "🗑️  Deleting: $($file.Name)" -ForegroundColor Gray
        Remove-Item $file.FullName -Force
    }
    Write-Host "`n✅ Workspace is now clean and optimized!" -ForegroundColor Green
} else {
    Write-Host "✨ Your workspace is already spotless. Nothing to delete." -ForegroundColor Green
}

Write-Host "==============================================" -ForegroundColor Cyan
