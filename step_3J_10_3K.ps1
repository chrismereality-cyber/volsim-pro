$ErrorActionPreference = "Stop"

$path = ".\src\services\execution_service.py"

if (-not (Test-Path $path)) {
    throw "File not found: $path"
}

$content = Get-Content $path -Raw

if ($content.Contains("reconciliation_required")) {
    Write-Host "PASS: reconciliation_required already exists."
    exit 0
}

$marker = "    async def send_order(self, order_request: dict):"

if (-not $content.Contains($marker)) {
    throw "FAIL: send_order() marker not found. No changes made."
}

$method = @"
    def _build_execution_result(
        self,
        *,
        success: bool,
        order_id=None,
        client_order_id=None,
        execution_mode=None,
        status=None,
        trade_id=None,
        order_ticket=None,
        deal_ticket=None,
        position_ticket=None,
        retcode=None,
        broker_retcode=None,
        comment=None,
        message=None,
        symbol=None,
        side=None,
        volume=None,
        price=None,
        retryable=None,
        reconciliation_required=False,
        broker_transmission_started=False,
        order_check_retcode=None,
        order_check_comment=None,
        order_check_passed=None,
        **extra,
    ):
        """
        Canonical execution result contract.

        Once broker transmission has started, automatic retry is unsafe
        unless broker reconciliation establishes the final broker state.
        """

        if retryable is None:
            retryable = (
                not broker_transmission_started
                and not reconciliation_required
            )

        result = {
            "success": bool(success),
            "status": status,
            "execution_mode": execution_mode or self.execution_mode,

            "order_id": order_id,
            "oms_order_id": order_id,
            "client_order_id": client_order_id,

            "trade_id": trade_id,

            "order_ticket": order_ticket,
            "deal_ticket": deal_ticket,
            "position_ticket": position_ticket,
            "ticket": order_ticket,

            "retcode": retcode,
            "broker_retcode": broker_retcode,
            "comment": comment,
            "message": message,

            "symbol": symbol,
            "side": side,
            "volume": volume,
            "price": price,

            "retryable": bool(retryable),
            "reconciliation_required": bool(
                reconciliation_required
            ),
            "broker_transmission_started": bool(
                broker_transmission_started
            ),

            "order_check_retcode": order_check_retcode,
            "order_check_comment": order_check_comment,
            "order_check_passed": order_check_passed,
        }

        result.update(extra)

        return result

"@

$content = $content.Replace(
    $marker,
    $method + "`r`n" + $marker
)

Set-Content -Path $path -Value $content -Encoding UTF8

Write-Host "PASS: reconciliation execution contract inserted."
Write-Host "FILE: $path"
