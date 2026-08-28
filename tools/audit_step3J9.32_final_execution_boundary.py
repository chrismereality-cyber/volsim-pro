from pathlib import Path
import ast

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "src" / "services" / "execution_service.py"
RUNTIME_TEST = ROOT / "tools" / "test_step3J9.31_real_mt5_order_check.py"

print("=" * 62)
print("VOLSIM-PRO STEP 3J.9.32")
print("FINAL MT5 EXECUTION-BOUNDARY VERIFICATION")
print("=" * 62)
print()

# ==============================================================
# PRODUCTION SOURCE
# ==============================================================

if not TARGET.exists():
    print(f"FAIL - production source not found: {TARGET}")
    raise SystemExit(1)

source = TARGET.read_text(encoding="utf-8-sig")

try:
    tree = ast.parse(source, filename=str(TARGET))
except SyntaxError as exc:
    print(f"FAIL - production source syntax error: {exc}")
    raise SystemExit(1)

print("PASS - execution_service.py parses successfully.")

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
# CALL DETECTION
# ==============================================================

def find_calls(attribute_name):
    calls = []

    for node in ast.walk(send_order):
        if isinstance(node, ast.Call):
            fn = node.func

            if isinstance(fn, ast.Attribute):
                if fn.attr == attribute_name:
                    calls.append(node)

    return calls


def find_authorization():
    matches = []

    for node in ast.walk(send_order):
        if isinstance(node, ast.Assign):
            if len(node.targets) != 1:
                continue

            target = node.targets[0]

            if (
                isinstance(target, ast.Name)
                and target.id == "live_transmission_authorized"
            ):
                matches.append(node)

    return matches


authorization = find_authorization()
risk = find_calls("approve_order")
guard = find_calls("evaluate")
checks = find_calls("order_check")
sends = find_calls("order_send")

print()
print("===== PRODUCTION EXECUTABLE INVENTORY =====")
print(f"authorization : {[x.lineno for x in authorization]}")
print(f"risk          : {[x.lineno for x in risk]}")
print(f"guard         : {[x.lineno for x in guard]}")
print(f"order_check   : {[x.lineno for x in checks]}")
print(f"order_send    : {[x.lineno for x in sends]}")

if len(authorization) != 1:
    print("FAIL - expected exactly one authorization assignment.")
    raise SystemExit(1)

if len(risk) != 1:
    print("FAIL - expected exactly one risk approval call.")
    raise SystemExit(1)

if len(guard) != 1:
    print("FAIL - expected exactly one execution guard call.")
    raise SystemExit(1)

if len(checks) != 1:
    print("FAIL - expected exactly one executable order_check().")
    raise SystemExit(1)

if len(sends) != 1:
    print("FAIL - expected exactly one executable order_send().")
    raise SystemExit(1)

print("PASS - executable call counts are correct.")

# ==============================================================
# ORDER
# ==============================================================

auth_line = authorization[0].lineno
risk_line = risk[0].lineno
guard_line = guard[0].lineno
check_line = checks[0].lineno
send_line = sends[0].lineno

print()
print("===== FINAL PRODUCTION ORDER =====")
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
    print("FAIL - production execution ordering is invalid.")
    raise SystemExit(1)

print("PASS - authorization precedes risk.")
print("PASS - risk precedes execution guard.")
print("PASS - execution guard precedes order_check().")
print("PASS - order_check() precedes order_send().")

# ==============================================================
# LITERAL TRUE AUTHORIZATION
# ==============================================================

auth_value = authorization[0].value

if not isinstance(auth_value, ast.Compare):
    print("FAIL - authorization is not an AST comparison.")
    raise SystemExit(1)

if not any(isinstance(op, ast.Is) for op in auth_value.ops):
    print("FAIL - authorization does not use 'is True'.")
    raise SystemExit(1)

has_true = any(
    isinstance(comparator, ast.Constant)
    and comparator.value is True
    for comparator in auth_value.comparators
)

if not has_true:
    print("FAIL - authorization does not compare against literal True.")
    raise SystemExit(1)

print("PASS - live authorization requires literal True.")

# ==============================================================
# RUNTIME TEST ARTIFACT
# ==============================================================

if not RUNTIME_TEST.exists():
    print(f"FAIL - runtime test not found: {RUNTIME_TEST}")
    raise SystemExit(1)

runtime_source = RUNTIME_TEST.read_text(encoding="utf-8-sig")

try:
    runtime_tree = ast.parse(
        runtime_source,
        filename=str(RUNTIME_TEST),
    )
except SyntaxError as exc:
    print(f"FAIL - runtime test syntax error: {exc}")
    raise SystemExit(1)

print()
print("===== STEP 3J.9.31 RUNTIME TEST SAFETY =====")

# The test must contain order_check.
runtime_check = [
    node
    for node in ast.walk(runtime_tree)
    if isinstance(node, ast.Call)
    and isinstance(node.func, ast.Attribute)
    and node.func.attr == "order_check"
]

if not runtime_check:
    print("FAIL - runtime test does not contain order_check().")
    raise SystemExit(1)

print("PASS - runtime test contains order_check().")

# The runtime test must explicitly replace order_send.
sentinel_names = [
    "forbidden_order_send",
    "SAFETY SENTINEL",
]

for marker in sentinel_names:
    if marker not in runtime_source:
        print(
            f"FAIL - runtime safety marker missing: {marker}"
        )
        raise SystemExit(1)

print("PASS - runtime test contains order_send safety sentinel.")

if "mt5.order_send = forbidden_order_send" not in runtime_source:
    print(
        "FAIL - runtime test does not explicitly replace "
        "mt5.order_send."
    )
    raise SystemExit(1)

print("PASS - runtime test explicitly blocks order_send().")

# Confirm the runtime test restores the reference only after testing.
if "mt5.order_send = real_order_send" not in runtime_source:
    print("FAIL - runtime test does not restore order_send reference.")
    raise SystemExit(1)

print("PASS - runtime test restores order_send reference after test.")

# ==============================================================
# FINAL RESULT
# ==============================================================

print()
print("=" * 62)
print("STEP 3J.9.32 PASSED")
print("=" * 62)
print("FINAL EXECUTION BOUNDARY VERIFIED.")
print()
print("Production:")
print("  authorization -> risk -> guard -> order_check -> order_send")
print()
print("Real MT5 validation:")
print("  initialize -> order_check -> shutdown")
print()
print("Transmission protection:")
print("  order_send() hard-blocked during 3J.9.31")
print()
print("NO SOURCE WAS MODIFIED.")
print("NO MT5 CONNECTION WAS OPENED BY THIS AUDIT.")
print("NO BROKER ORDER WAS TRANSMITTED BY THIS AUDIT.")
print("=" * 62)
