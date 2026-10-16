from src.services.ai_execution_service import AIExecutionService
from src.services.execution_risk_gate_service import ExecutionRiskGateService
from src.services.order_builder_service import OrderBuilderService


def run_exit_pipeline(**overrides):
    symbol = "XAUUSDm"
    decision = {
        "decision": "EXIT",
        "decision_id": "TEST-POSITION-EXIT-001",
        "confidence": 40,
        "symbol": symbol,
        "risk_permission": True,
        "execution_allowed": True,
        "position_management_exit_authorized": True,
        "trade_id": "TEST-OPEN-TRADE-001",
        "position_side": "BUY",
    }
    decision.update(overrides)

    execution = AIExecutionService().evaluate(
        decision, risk_state={}, portfolio_state={"exposure": 0}, symbol=symbol
    )
    risk = ExecutionRiskGateService().approve(
        decision, execution, risk_state={}, portfolio_state={"exposure": 0}, symbol=symbol
    )
    order = OrderBuilderService().build(decision, risk, symbol=symbol)
    return execution, risk, order



def test_authorized_exit_below_risk_confidence_floor_passes():
    execution, risk, order = run_exit_pipeline(confidence=10)

    assert execution["status"] == "READY"
    assert execution["execution_signal"] == "EXIT"
    assert risk["approved"] is True
    assert order["order_ready"] is True
    assert order["order_request"]["type"] == "EXIT"


def test_buy_below_risk_confidence_floor_remains_blocked():
    execution, risk, order = run_exit_pipeline(
        decision="BUY",
        confidence=10,
        position_management_exit_authorized=False,
    )

    assert risk["approved"] is False
    assert order["order_ready"] is False
    assert order["order_request"] is None


def test_low_confidence_exit_without_authorization_remains_blocked():
    decision = {
        "decision": "EXIT",
        "decision_id": "TEST-UNAUTHORIZED-EXIT-001",
        "confidence": 10,
        "symbol": "XAUUSDm",
        "risk_permission": True,
        "execution_allowed": True,
        "trade_id": "TEST-OPEN-TRADE-001",
        "position_side": "BUY",
    }

    execution = AIExecutionService().evaluate(
        decision, risk_state={}, portfolio_state={"exposure": 0}, symbol="XAUUSDm"
    )
    risk = ExecutionRiskGateService().approve(
        decision, execution, risk_state={}, portfolio_state={"exposure": 0}, symbol="XAUUSDm"
    )

    assert risk["approved"] is False


def test_low_confidence_authorized_exit_respects_risk_permission():
    _, risk, order = run_exit_pipeline(confidence=10, risk_permission=False)

    assert risk["approved"] is False
    assert order["order_ready"] is False
    assert order["order_request"] is None

def test_authorized_exit_passes_three_service_pipeline():
    execution, risk, order = run_exit_pipeline()

    assert execution["status"] == "READY"
    assert execution["execution_signal"] == "EXIT"
    assert risk["approved"] is True
    assert risk["decision_id"] == "TEST-POSITION-EXIT-001"
    assert order["status"] == "READY"
    assert order["order_ready"] is True

    request = order["order_request"]
    assert request["type"] == "EXIT"
    assert request["trade_id"] == "TEST-OPEN-TRADE-001"
    assert request["position_side"] == "BUY"
    assert request["decision_id"] == "TEST-POSITION-EXIT-001"


def test_exit_without_trade_id_is_not_authorized_or_built():
    execution, risk, order = run_exit_pipeline(trade_id=None)

    assert execution["status"] != "READY"
    assert risk["approved"] is False
    assert order["order_ready"] is False
    assert order["order_request"] is None


def test_risk_permission_denial_blocks_order():
    _, risk, order = run_exit_pipeline(risk_permission=False)

    assert risk["approved"] is False
    assert order["status"] == "BLOCKED"
    assert order["order_ready"] is False
    assert order["order_request"] is None
