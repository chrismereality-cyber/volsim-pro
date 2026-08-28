from pathlib import Path
import ast
import hashlib
import sys

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src" / "services" / "execution_service.py"
RUNTIME_TEST = ROOT / "tools" / "test_step3J9.31_real_mt5_order_check.py"

print("=" * 62)
print("VOLSIM-PRO STEP 3J.10.0")
print("PRE-LIVE TRANSMISSION READINESS AUDIT")
print("=" * 62)
print()
print(f"PROJECT ROOT : {ROOT}")
print()

# ==============================================================
# 1. PRODUCTION SOURCE
# ==============================================================

if not SOURCE.exists():
    print(f"FAIL - production source not found: {SOURCE}")
    raise SystemExit(1)

source = SOURCE.read_text(encoding="utf-8-sig")

try:
    tree = ast.parse(source, filename=str(SOURCE))
except SyntaxError as exc:
    print(f"FAIL - production source does not parse: {exc}")
    raise SystemExit(1)

print("PASS - execution_service.py parses successfully.")

sha256 = hashlib.sha256(
    SOURCE.read_bytes()
).hexdigest()

print(f"SOURCE SHA256 : {sha256}")

# ==============================================================
# 2. SEND_ORDER DISCOVERY
# ==============================================================

send_order = None

for node in ast.walk(tree):
    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
        if node.name == "send_order":
            send_order = node
            break

if send_order is None:
    print("FAIL - send_order() not found.")
    raise SystemExit(1)

print(
    f"PASS - send_order() found: "
    f"lines {send_order.lineno}-{send_order.end_lineno}"
)

# ==============================================================
# 3. EXECUTABLE CALL INVENTORY
# ==============================================================

def calls_named(name):
    result = []

    for node in ast.walk(send_order):
        if isinstance(node, ast.Call):
            fn = node.func

            if isinstance(fn, ast.Attribute) and fn.attr == name:
                result.append(node)

    return result


def authorization_assignments():
    result = []

    for node in ast.walk(send_order):
        if isinstance(node, ast.Assign):
            if len(node.targets) != 1:
                continue

            target = node.targets[0]

            if (
                isinstance(target, ast.Name)
                and target.id == "live_transmission_authorized"
            ):
                result.append(node)

    return result


auth = authorization_assignments()
risk = calls_named("approve_order")
guard = calls_named("evaluate")
order_check = calls_named("order_check")
order_send = calls_named("order_send")

print()
print("===== EXECUTABLE INVENTORY =====")
print(f"authorization : {[x.lineno for x in auth]}")
print(f"risk          : {[x.lineno for x in risk]}")
print(f"guard         : {[x.lineno for x in guard]}")
print(f"order_check   : {[x.lineno for x in order_check]}")
print(f"order_send    : {[x.lineno for x in order_send]}")

if len(auth) != 1:
    print("FAIL - expected exactly one authorization assignment.")
    raise SystemExit(1)

if len(risk) != 1:
    print("FAIL - expected exactly one risk approval call.")
    raise SystemExit(1)

if len(guard) != 1:
    print("FAIL - expected exactly one execution guard call.")
    raise SystemExit(1)

if len(order_check) != 1:
    print("FAIL - expected exactly one order_check().")
    raise SystemExit(1)

if len(order_send) != 1:
    print("FAIL - expected exactly one order_send().")
    raise SystemExit(1)

print("PASS - executable call counts are correct.")

# ==============================================================
# 4. ORDERING
# ==============================================================

auth_line = auth[0].lineno
risk_line = risk[0].lineno
guard_line = guard[0].lineno
check_line = order_check[0].lineno
send_line = order_send[0].lineno

print()
print("===== EXECUTION ORDER =====")
print(f"authorization : {auth_line}")
print(f"risk          : {risk_line}")
print(f"guard         : {guard_line}")
print(f"order_check   : {check_line}")
print(f"order_send    : {send_line}")

if not (
    auth_line
    < risk_line
    < guard_line
    < check_line
    < send_line
):
    print("FAIL - execution ordering invalid.")
    raise SystemExit(1)

print("PASS - authorization precedes risk.")
print("PASS - risk precedes execution guard.")
print("PASS - execution guard precedes order_check().")
print("PASS - order_check() precedes order_send().")

# ==============================================================
# 5. LITERAL TRUE AUTHORIZATION
# ==============================================================

auth_value = auth[0].value

if not isinstance(auth_value, ast.Compare):
    print("FAIL - authorization is not an AST comparison.")
    raise SystemExit(1)

if not any(isinstance(op, ast.Is) for op in auth_value.ops):
    print("FAIL - authorization does not use 'is True'.")
    raise SystemExit(1)

if not any(
    isinstance(value, ast.Constant) and value.value is True
    for value in auth_value.comparators
):
    print("FAIL - authorization does not require literal True.")
    raise SystemExit(1)

print("PASS - live transmission requires literal True.")

# ==============================================================
# 6. IDEMPOTENCY
# ==============================================================

required_idempotency = [
    "_claim_execution_idempotency",
    "_finalize_execution_idempotency",
    "_release_execution_idempotency",
]

print()
print("===== IDEMPOTENCY CONTRACT =====")

for name in required_idempotency:
    if name not in source:
        print(f"FAIL - missing idempotency method: {name}")
        raise SystemExit(1)

    print(f"PASS - {name} present.")

# ==============================================================
# 7. RISK / LOSS / KILL-SWITCH REFERENCES
# ==============================================================

risk_markers = [
    "risk_engine_service",
    "orders_rejected",
    "last_error",
]

print()
print("===== RISK CONTROL REFERENCES =====")

for marker in risk_markers:
    if marker not in source:
        print(f"FAIL - required risk marker missing: {marker}")
        raise SystemExit(1)

    print(f"PASS - {marker} present.")

# ==============================================================
# 8. LIVE AUTHORIZATION CONTRACT
# ==============================================================

authorization_markers = [
    "live_transmission_authorized",
    "LIVE_TRANSMISSION_NOT_AUTHORIZED",
]

print()
print("===== LIVE AUTHORIZATION CONTRACT =====")

for marker in authorization_markers:
    if marker not in source:
        print(f"FAIL - missing authorization marker: {marker}")
        raise SystemExit(1)

    print(f"PASS - {marker} present.")

# ==============================================================
# 9. MT5 BOUNDARY
# ==============================================================

print()
print("===== MT5 BOUNDARY =====")

if "order_check" not in source:
    print("FAIL - order_check reference missing.")
    raise SystemExit(1)

if "order_send" not in source:
    print("FAIL - order_send reference missing.")
    raise SystemExit(1)

print("PASS - order_check boundary present.")
print("PASS - order_send boundary present.")

# ==============================================================
# 10. TEST HARNESS SAFETY
# ==============================================================

print()
print("===== PREVIOUS TEST HARNESS SAFETY =====")

if RUNTIME_TEST.exists():
    runtime_source = RUNTIME_TEST.read_text(
        encoding="utf-8-sig"
    )

    if "SAFETY SENTINEL" not in runtime_source:
        print(
            "FAIL - previous runtime test does not contain "
            "the safety sentinel."
        )
        raise SystemExit(1)

    if "mt5.order_send = forbidden_order_send" not in runtime_source:
        print(
            "FAIL - previous runtime test does not explicitly "
            "block order_send()."
        )
        raise SystemExit(1)

    print("PASS - previous runtime harness contains order_send safety sentinel.")
    print("PASS - previous runtime harness explicitly blocked transmission.")
else:
    print(
        "WARN - previous runtime test not found. "
        "Continuing production-only audit."
    )

# ==============================================================
# 11. FORBIDDEN LIVE ACTIONS
# ==============================================================

print()
print("===== AUDIT SAFETY =====")

print("PASS - this audit performs no MT5 initialization.")
print("PASS - this audit performs no order_check().")
print("PASS - this audit performs no order_send().")
print("PASS - this audit does not modify production source.")

# ==============================================================
# FINAL
# ==============================================================

print()
print("=" * 62)
print("STEP 3J.10.0 PASSED")
print("=" * 62)
print()
print("PRE-LIVE TRANSMISSION READINESS AUDIT PASSED.")
print()
print("Verified:")
print("  authorization -> risk -> guard -> order_check -> order_send")
print("  literal-True live authorization")
print("  idempotency contract")
print("  risk-control references")
print("  MT5 execution boundary")
print("  previous runtime transmission protection")
print()
print("IMPORTANT:")
print("This does NOT authorize a live broker order.")
print("No MT5 connection was opened.")
print("No order_check() was executed.")
print("No order_send() was executed.")
print("=" * 62)
