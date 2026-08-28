from pathlib import Path
import ast

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "src" / "services" / "execution_service.py"

print("=" * 62)
print("VOLSIM-PRO STEP 3J.9.29")
print("POST-RUNTIME EXECUTION SAFETY AUDIT")
print("=" * 62)

if not TARGET.exists():
    print(f"FAIL - target not found: {TARGET}")
    raise SystemExit(1)

source = TARGET.read_text(encoding="utf-8-sig")
tree = ast.parse(source, filename=str(TARGET))

send_order = None

for node in ast.walk(tree):
    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
        if node.name == "send_order":
            send_order = node
            break

if send_order is None:
    print("FAIL - send_order() not found.")
    raise SystemExit(1)

def calls_named(node, name):
    found = []
    for child in ast.walk(node):
        if isinstance(child, ast.Call):
            fn = child.func

            if isinstance(fn, ast.Attribute):
                if fn.attr == name:
                    found.append(child)

    return found

def line(call):
    return getattr(call, "lineno", None)

authorization = []
risk = []
guard = []
checks = []
sends = []

for child in ast.walk(send_order):
    if isinstance(child, ast.Assign):
        if isinstance(child.targets[0], ast.Name):
            if child.targets[0].id == "live_transmission_authorized":
                authorization.append(child)

    if isinstance(child, ast.Call):
        fn = child.func

        if isinstance(fn, ast.Attribute):
            if fn.attr == "approve_order":
                risk.append(child)

            elif fn.attr == "evaluate":
                guard.append(child)

            elif fn.attr == "order_check":
                checks.append(child)

            elif fn.attr == "order_send":
                sends.append(child)

print()
print("===== EXECUTABLE SAFETY CALLS =====")
print(f"authorization : {[line(x) for x in authorization]}")
print(f"risk          : {[line(x) for x in risk]}")
print(f"guard         : {[line(x) for x in guard]}")
print(f"order_check   : {[line(x) for x in checks]}")
print(f"order_send    : {[line(x) for x in sends]}")

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
    print("FAIL - expected exactly one order_check().")
    raise SystemExit(1)

if len(sends) != 1:
    print("FAIL - expected exactly one order_send().")
    raise SystemExit(1)

auth_line = line(authorization[0])
risk_line = line(risk[0])
guard_line = line(guard[0])
check_line = line(checks[0])
send_line = line(sends[0])

print()
print("===== STRUCTURAL ORDER =====")
print(
    f"authorization -> risk -> guard -> "
    f"order_check -> order_send"
)

if not (
    auth_line < risk_line
    < guard_line
    < check_line
    < send_line
):
    print("FAIL - execution ordering is invalid.")
    raise SystemExit(1)

print("PASS - authorization precedes risk.")
print("PASS - risk precedes execution guard.")
print("PASS - execution guard precedes order_check().")
print("PASS - order_check() precedes order_send().")

# Verify authorization is literal True-based.
auth = authorization[0].value

if not isinstance(auth, ast.Compare):
    print("FAIL - authorization is not a comparison.")
    raise SystemExit(1)

if not any(
    isinstance(op, ast.Is)
    for op in auth.ops
):
    print("FAIL - authorization does not use literal 'is True'.")
    raise SystemExit(1)

print("PASS - authorization remains literal-True based.")

print()
print("=" * 62)
print("STEP 3J.9.29 PASSED")
print("=" * 62)
print("Production execution structure remains intact.")
print("No source was modified.")
print("No MT5 connection was opened.")
print("No broker order was transmitted.")
print("=" * 62)
