$ErrorActionPreference = "Stop"

$path = ".\src\services\execution_service.py"

if (-not (Test-Path $path)) {
    throw "execution_service.py not found."
}

$content = Get-Content $path -Raw

$tests = @(
    @{
        Name = "PRE_TRANSMISSION_RELEASE"
        Required = @(
            "await self._release_execution_idempotency(client_order_id)"
            "status = 'IN_PROGRESS'"
            "order_check"
        )
    },
    @{
        Name = "TRANSMISSION_BOUNDARY"
        Required = @(
            "broker_transmission_started = True"
            "result = mt5.order_send(request)"
        )
    },
    @{
        Name = "UNKNOWN_TRANSMISSION"
        Required = @(
            "TRANSMISSION_UNKNOWN"
            "Broker reconciliation is required before retry"
            "reconciliation_required"
        )
    },
    @{
        Name = "DURABLE_FINALIZATION"
        Required = @(
            "_finalize_execution_idempotency"
            "status = 'SUCCESS' if result.get('success') else 'FAILED'"
            "updated_at = NOW()"
        )
    }
)

$failed = $false

foreach ($test in $tests) {

    Write-Host ""
    Write-Host "TEST: $($test.Name)"

    foreach ($required in $test.Required) {

        if ($content.Contains($required)) {
            Write-Host "  PASS: $required"
        }
        else {
            Write-Host "  FAIL: $required"
            $failed = $true
        }
    }
}

Write-Host ""

if ($failed) {
    Write-Host "FAIL: Step 3J.10.4 contract matrix"
    exit 1
}

Write-Host "PASS: Step 3J.10.4 contract matrix"
