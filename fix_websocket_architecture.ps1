$ErrorActionPreference = "Stop"

# ============================================================
# VolSim-Pro Frontend WebSocket Architecture Repair
# ============================================================

$FrontendRoot = "C:\volsim-dev\apps\frontend"

if (-not (Test-Path -LiteralPath $FrontendRoot)) {
    throw "Frontend root does not exist: $FrontendRoot"
}

Set-Location -LiteralPath $FrontendRoot

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " VolSim-Pro WebSocket Architecture Repair" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Frontend: $FrontendRoot" -ForegroundColor Gray
Write-Host ""

# ------------------------------------------------------------
# PATHS
# ------------------------------------------------------------

$UseDataStream = Join-Path $FrontendRoot "hooks\useDataStream.ts"
$SocketManager = Join-Path $FrontendRoot "lib\TradingSocketManager.ts"
$RegimeView = Join-Path $FrontendRoot "components\views\RegimeRobustnessView.tsx"
$RiskPanel = Join-Path $FrontendRoot "src\components\RiskManagementPanel.tsx"
$GlobalContext = Join-Path $FrontendRoot "src\context\GlobalStateContext.tsx"

$RequiredFiles = @(
    $UseDataStream,
    $SocketManager,
    $RegimeView,
    $RiskPanel,
    $GlobalContext
)

# ------------------------------------------------------------
# STEP 1 — VERIFY FILES
# ------------------------------------------------------------

Write-Host "[1/8] Verifying required frontend files..." -ForegroundColor Yellow

foreach ($File in $RequiredFiles) {

    if (Test-Path -LiteralPath $File) {
        Write-Host "  PASS: $File" -ForegroundColor Green
    }
    else {
        Write-Host "  WARNING: File not found: $File" -ForegroundColor Yellow
    }
}

Write-Host ""

# ------------------------------------------------------------
# STEP 2 — CREATE BACKUP
# ------------------------------------------------------------

Write-Host "[2/8] Creating backup..." -ForegroundColor Yellow

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupRoot = Join-Path $FrontendRoot "backup_socket_fix_$Timestamp"

New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null

foreach ($File in $RequiredFiles) {

    if (Test-Path -LiteralPath $File) {

        $RelativePath = $File.Substring($FrontendRoot.Length).TrimStart("\")
        $Destination = Join-Path $BackupRoot $RelativePath
        $DestinationDirectory = Split-Path -Parent $Destination

        New-Item -ItemType Directory -Path $DestinationDirectory -Force | Out-Null

        Copy-Item `
            -LiteralPath $File `
            -Destination $Destination `
            -Force

        Write-Host "  Backed up: $RelativePath" -ForegroundColor Gray
    }
}

Write-Host "  Backup created: $BackupRoot" -ForegroundColor Green
Write-Host ""

# ------------------------------------------------------------
# STEP 3 — ENSURE useDataStream IS THE CONNECTION OWNER
# ------------------------------------------------------------

Write-Host "[3/8] Configuring useDataStream as the single socket connection owner..." -ForegroundColor Yellow

if (-not (Test-Path -LiteralPath $UseDataStream)) {

    throw "useDataStream.ts not found: $UseDataStream"
}

$UseDataStreamText = Get-Content -LiteralPath $UseDataStream -Raw

# Make sure useDataStream imports the shared manager.
if ($UseDataStreamText -notmatch "TradingSocketManager") {

    Write-Host "  Adding TradingSocketManager import..." -ForegroundColor Yellow

    $ImportLine = 'import { tradingSocket } from "../lib/TradingSocketManager";'

    $UseDataStreamText = $ImportLine + "`r`n" + $UseDataStreamText
}

# Make sure useDataStream has the shared connection call.
if ($UseDataStreamText -notmatch 'tradingSocket\.connect\s*\(\s*["'']\/ws\/trading-state["'']\s*\)') {

    Write-Host "  Adding shared WebSocket connection call..." -ForegroundColor Yellow

    $ConnectLine = '    tradingSocket.connect("/ws/trading-state");'

    # Try to place connection inside the first useEffect.
    if ($UseDataStreamText -match "useEffect\s*\(\s*\(\s*\)\s*=>\s*\{") {

        $UseDataStreamText = [regex]::Replace(
            $UseDataStreamText,
            "(useEffect\s*\(\s*\(\s*\)\s*=>\s*\{)",
            "`$1`r`n$ConnectLine",
            1
        )
    }
    else {

        Write-Host "  WARNING: Could not automatically locate useEffect." -ForegroundColor Yellow
        Write-Host "  Existing useDataStream.ts will be preserved." -ForegroundColor Yellow
    }
}

Set-Content `
    -LiteralPath $UseDataStream `
    -Value $UseDataStreamText `
    -Encoding UTF8

Write-Host "  useDataStream.ts processed successfully." -ForegroundColor Green
Write-Host ""

# ------------------------------------------------------------
# STEP 4 — REMOVE DUPLICATE CONNECTION OWNERS
# ------------------------------------------------------------

Write-Host "[4/8] Removing duplicate tradingSocket.connect() calls..." -ForegroundColor Yellow

$DuplicateFiles = @(
    $RegimeView,
    $RiskPanel,
    $GlobalContext
)

foreach ($File in $DuplicateFiles) {

    if (Test-Path -LiteralPath $File) {

        $Text = Get-Content -LiteralPath $File -Raw

        # Remove:
        #
        # tradingSocket.connect("/ws/trading-state");
        #
        # tradingSocket.connect('/ws/trading-state');
        #
        # tradingSocket.connect(
        #     "/ws/trading-state"
        # );
        #
        # while leaving subscriptions untouched.

        $Pattern = '(?ms)[\t ]*tradingSocket\.connect\s*\(\s*["'']\/ws\/trading-state["'']\s*\)\s*;?\s*'

        $NewText = [regex]::Replace($Text, $Pattern, "")

        if ($NewText -ne $Text) {

            Set-Content `
                -LiteralPath $File `
                -Value $NewText `
                -Encoding UTF8

            Write-Host "  FIXED: $File" -ForegroundColor Green
        }
        else {

            Write-Host "  OK: No duplicate connection found in $File" -ForegroundColor Gray
        }
    }
    else {

        Write-Host "  SKIPPED: File not found: $File" -ForegroundColor Yellow
    }
}

Write-Host ""

# ------------------------------------------------------------
# STEP 5 — VERIFY SHARED SOCKET MANAGER
# ------------------------------------------------------------

Write-Host "[5/8] Verifying TradingSocketManager..." -ForegroundColor Yellow

if (-not (Test-Path -LiteralPath $SocketManager)) {

    throw "TradingSocketManager.ts not found: $SocketManager"
}

$SocketText = Get-Content -LiteralPath $SocketManager -Raw

$HasConstructor = $SocketText -match "new\s+WebSocket"
$HasExport = $SocketText -match "export\s+const\s+tradingSocket"
$HasConnectMethod = $SocketText -match "connect\s*\("
$HasSubscribeMethod = $SocketText -match "subscribe\s*\("

if ($HasConstructor) {
    Write-Host "  PASS: WebSocket constructor exists." -ForegroundColor Green
}
else {
    Write-Host "  FAIL: WebSocket constructor not found." -ForegroundColor Red
}

if ($HasExport) {
    Write-Host "  PASS: Shared tradingSocket export exists." -ForegroundColor Green
}
else {
    Write-Host "  FAIL: Shared tradingSocket export not found." -ForegroundColor Red
}

if ($HasConnectMethod) {
    Write-Host "  PASS: connect() method exists." -ForegroundColor Green
}
else {
    Write-Host "  FAIL: connect() method not found." -ForegroundColor Red
}

if ($HasSubscribeMethod) {
    Write-Host "  PASS: subscribe() method exists." -ForegroundColor Green
}
else {
    Write-Host "  FAIL: subscribe() method not found." -ForegroundColor Red
}

if (-not $HasConstructor -or -not $HasExport -or -not $HasConnectMethod -or -not $HasSubscribeMethod) {

    Write-Host ""
    Write-Host "TradingSocketManager contents:" -ForegroundColor Yellow
    Get-Content -LiteralPath $SocketManager

    throw "TradingSocketManager validation failed."
}

Write-Host ""

# ------------------------------------------------------------
# STEP 6 — VERIFY ONLY ONE WebSocket CONSTRUCTOR
# ------------------------------------------------------------

Write-Host "[6/8] Verifying active WebSocket constructors..." -ForegroundColor Yellow

$SocketCreationMatches = @(
    Get-ChildItem `
        -LiteralPath $FrontendRoot `
        -Recurse `
        -File `
        -Include *.tsx,*.ts |
    Where-Object {
        $_.FullName -notmatch "\\node_modules\\" -and
        $_.FullName -notmatch "\\backup_" -and
        $_.FullName -notmatch "\\\.next\\"
    } |
    Select-String -Pattern "new\s+WebSocket"
)

if ($SocketCreationMatches.Count -eq 1) {

    Write-Host ""
    Write-Host "PASS: Exactly ONE active WebSocket constructor exists." -ForegroundColor Green

    foreach ($Match in $SocketCreationMatches) {

        Write-Host `
            "OWNER: $($Match.Path):$($Match.LineNumber)" `
            -ForegroundColor Green
    }
}
elseif ($SocketCreationMatches.Count -eq 0) {

    Write-Host ""
    Write-Host "FAIL: No active WebSocket constructor found." -ForegroundColor Red
}
else {

    Write-Host ""
    Write-Host "FAIL: Multiple active WebSocket constructors found." -ForegroundColor Red

    foreach ($Match in $SocketCreationMatches) {

        Write-Host `
            "$($Match.Path):$($Match.LineNumber): $($Match.Line.Trim())" `
            -ForegroundColor Red
    }
}

Write-Host ""

# ------------------------------------------------------------
# STEP 7 — VERIFY CONNECTION OWNERSHIP
# ------------------------------------------------------------

Write-Host "[7/8] Verifying tradingSocket.connect() ownership..." -ForegroundColor Yellow

$ConnectMatches = @(
    Get-ChildItem `
        -LiteralPath $FrontendRoot `
        -Recurse `
        -File `
        -Include *.tsx,*.ts |
    Where-Object {
        $_.FullName -notmatch "\\node_modules\\" -and
        $_.FullName -notmatch "\\backup_" -and
        $_.FullName -notmatch "\\\.next\\"
    } |
    Select-String -Pattern "tradingSocket\.connect"
)

Write-Host ""
Write-Host "Active connection calls found: $($ConnectMatches.Count)" -ForegroundColor Cyan

foreach ($Match in $ConnectMatches) {

    Write-Host `
        "$($Match.Path):$($Match.LineNumber): $($Match.Line.Trim())" `
        -ForegroundColor Gray
}

$UseDataStreamConnectMatches = @(
    $ConnectMatches |
    Where-Object {
        $_.Path -eq $UseDataStream
    }
)

$DuplicateConnectMatches = @(
    $ConnectMatches |
    Where-Object {
        $_.Path -ne $UseDataStream
    }
)

Write-Host ""

if ($ConnectMatches.Count -eq 1 -and $UseDataStreamConnectMatches.Count -eq 1) {

    Write-Host "PASS: Exactly ONE active tradingSocket.connect() call remains." -ForegroundColor Green
    Write-Host "OWNER: $UseDataStream" -ForegroundColor Green
}
else {

    Write-Host "FAIL: WebSocket connection ownership is not correct." -ForegroundColor Red
    Write-Host "Total connect calls: $($ConnectMatches.Count)" -ForegroundColor Red
    Write-Host "useDataStream connect calls: $($UseDataStreamConnectMatches.Count)" -ForegroundColor Red
    Write-Host "Duplicate connect calls: $($DuplicateConnectMatches.Count)" -ForegroundColor Red

    if ($DuplicateConnectMatches.Count -gt 0) {

        Write-Host ""
        Write-Host "Duplicate connection calls still present:" -ForegroundColor Yellow

        foreach ($Match in $DuplicateConnectMatches) {

            Write-Host `
                "$($Match.Path):$($Match.LineNumber): $($Match.Line.Trim())" `
                -ForegroundColor Yellow
        }
    }
}

Write-Host ""

# ------------------------------------------------------------
# STEP 8 — VERIFY SUBSCRIBERS + TYPESCRIPT
# ------------------------------------------------------------

Write-Host "[8/8] Verifying shared socket subscribers..." -ForegroundColor Yellow

$SubscriberMatches = @(
    Get-ChildItem `
        -LiteralPath $FrontendRoot `
        -Recurse `
        -File `
        -Include *.tsx,*.ts |
    Where-Object {
        $_.FullName -notmatch "\\node_modules\\" -and
        $_.FullName -notmatch "\\backup_" -and
        $_.FullName -notmatch "\\\.next\\"
    } |
    Select-String -Pattern "tradingSocket\.subscribe"
)

if ($SubscriberMatches.Count -gt 0) {

    Write-Host "PASS: Shared socket subscribers found: $($SubscriberMatches.Count)" -ForegroundColor Green

    foreach ($Match in $SubscriberMatches) {

        Write-Host `
            "$($Match.Path):$($Match.LineNumber): $($Match.Line.Trim())" `
            -ForegroundColor Gray
    }
}
else {

    Write-Host "WARNING: No tradingSocket.subscribe() calls found." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " TYPESCRIPT VALIDATION" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$PackageJson = Join-Path $FrontendRoot "package.json"

if (Test-Path -LiteralPath $PackageJson) {

    $TsConfig = Get-ChildItem `
        -LiteralPath $FrontendRoot `
        -Filter "tsconfig.json" `
        -File `
        -ErrorAction SilentlyContinue

    if ($TsConfig) {

        Write-Host "Running npx tsc --noEmit..." -ForegroundColor Yellow
        Write-Host ""

        npx tsc --noEmit

        $TsExitCode = $LASTEXITCODE

        Write-Host ""

        if ($TsExitCode -eq 0) {

            Write-Host "PASS: TypeScript validation succeeded." -ForegroundColor Green
        }
        else {

            Write-Host "WARNING: TypeScript validation returned exit code $TsExitCode." -ForegroundColor Yellow
            Write-Host "The WebSocket architecture changes remain applied." -ForegroundColor Yellow
        }
    }
    else {

        Write-Host "WARNING: No tsconfig.json found." -ForegroundColor Yellow
        Write-Host "Skipping TypeScript validation." -ForegroundColor Yellow
    }
}
else {

    Write-Host "WARNING: package.json not found." -ForegroundColor Yellow
    Write-Host "Skipping TypeScript validation." -ForegroundColor Yellow
}

# ------------------------------------------------------------
# FINAL ARCHITECTURE REPORT
# ------------------------------------------------------------

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " FINAL VolSim-Pro SOCKET ARCHITECTURE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Backend:" -ForegroundColor Cyan
Write-Host "  GET  /api/trading-state"
Write-Host "  GET  /api/telemetry"
Write-Host "  WS   /ws/trading-state"
Write-Host ""

Write-Host "Backend WebSocket owner:" -ForegroundColor Cyan
Write-Host "  src/api/main.py"
Write-Host ""

Write-Host "Frontend WebSocket manager:" -ForegroundColor Cyan
Write-Host "  lib/TradingSocketManager.ts"
Write-Host ""

Write-Host "Frontend connection owner:" -ForegroundColor Cyan
Write-Host "  hooks/useDataStream.ts"
Write-Host ""

Write-Host "Frontend subscribers:" -ForegroundColor Cyan
Write-Host "  components/views/RegimeRobustnessView.tsx"
Write-Host "  src/components/RiskManagementPanel.tsx"
Write-Host "  src/context/GlobalStateContext.tsx"
Write-Host ""

Write-Host "Expected architecture:" -ForegroundColor Green
Write-Host ""
Write-Host "                 FastAPI" -ForegroundColor Gray
Write-Host "                    |" -ForegroundColor Gray
Write-Host "                    | WS /ws/trading-state" -ForegroundColor Gray
Write-Host "                    v" -ForegroundColor Gray
Write-Host "          TradingSocketManager" -ForegroundColor Gray
Write-Host "                    |" -ForegroundColor Gray
Write-Host "                    v" -ForegroundColor Gray
Write-Host "             useDataStream" -ForegroundColor Gray
Write-Host "                    |" -ForegroundColor Gray
Write-Host "             +------+------+" -ForegroundColor Gray
Write-Host "             |      |      |" -ForegroundColor Gray
Write-Host "             v      v      v" -ForegroundColor Gray
Write-Host "          Global  Risk   Regime" -ForegroundColor Gray
Write-Host "          State   Panel  View" -ForegroundColor Gray
Write-Host ""

$FinalConnectMatches = @(
    Get-ChildItem `
        -LiteralPath $FrontendRoot `
        -Recurse `
        -File `
        -Include *.tsx,*.ts |
    Where-Object {
        $_.FullName -notmatch "\\node_modules\\" -and
        $_.FullName -notmatch "\\backup_" -and
        $_.FullName -notmatch "\\\.next\\"
    } |
    Select-String -Pattern "tradingSocket\.connect"
)

$FinalSocketMatches = @(
    Get-ChildItem `
        -LiteralPath $FrontendRoot `
        -Recurse `
        -File `
        -Include *.tsx,*.ts |
    Where-Object {
        $_.FullName -notmatch "\\node_modules\\" -and
        $_.FullName -notmatch "\\backup_" -and
        $_.FullName -notmatch "\\\.next\\"
    } |
    Select-String -Pattern "new\s+WebSocket"
)

if (
    $FinalConnectMatches.Count -eq 1 -and
    $FinalConnectMatches[0].Path -eq $UseDataStream -and
    $FinalSocketMatches.Count -eq 1
) {

    Write-Host "============================================================" -ForegroundColor Green
    Write-Host " PASS: SINGLE SOCKET OWNER ARCHITECTURE CONFIRMED" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
}
else {

    Write-Host "============================================================" -ForegroundColor Yellow
    Write-Host " WARNING: SOCKET OWNERSHIP STILL NEEDS REVIEW" -ForegroundColor Yellow
    Write-Host "============================================================" -ForegroundColor Yellow

    Write-Host ""
    Write-Host "Final connect calls: $($FinalConnectMatches.Count)" -ForegroundColor Yellow
    Write-Host "Final WebSocket constructors: $($FinalSocketMatches.Count)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Backup retained at:" -ForegroundColor Cyan
Write-Host "  $BackupRoot" -ForegroundColor Gray
Write-Host ""

Write-Host "============================================================" -ForegroundColor Green
Write-Host " WebSocket repair script finished." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

