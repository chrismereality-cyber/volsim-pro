from pathlib import Path
import ast
import sys

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "src" / "services" / "execution_service.py"

print("=" * 62)
print("VOLSIM-PRO STEP 3J.9.30")
print("REAL MT5 ORDER_CHECK / ZERO-TRANSMISSION GATE")
print("=" * 62)

source = TARGET.read_text(encoding="utf-8-sig")
tree = ast.parse(source, filename=str(TARGET))

print("PASS - execution_service.py parses successfully.")

# Structural confirmation before importing anything capable of MT5 access.
send_order = None

for node in ast.walk(tree):
    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
        if node.name == "send_order":
            send_order = node
            break

if send_order is None:
    print("FAIL - send_order() not found.")
    raise SystemExit(1)

def find_calls(name):
    result = []

    for node in ast.walk(send_order):
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Attribute):
                if node.func.attr == name:
                    result.append(node)

    return result

checks = find_calls("order_check")
sends = find_calls("order_send")

print(f"order_check() calls in source : {len(checks)}")
print(f"order_send() calls in source  : {len(sends)}")

if len(checks) != 1:
    print("FAIL - expected exactly one order_check().")
    raise SystemExit(1)

if len(sends) != 1:
    print("FAIL - expected exactly one order_send().")
    raise SystemExit(1)

check_line = checks[0].lineno
send_line = sends[0].lineno

print(f"order_check() source line     : {check_line}")
print(f"order_send() source line      : {send_line}")

if check_line >= send_line:
    print("FAIL - order_check() does not precede order_send().")
    raise SystemExit(1)

print("PASS - order_check() precedes order_send().")
print()

print("==============================================================")
print("STRUCTURAL GATE PASSED")
print("==============================================================")
print("This script intentionally performs NO runtime execution.")
print("It does not initialize MT5.")
print("It does not call order_check().")
print("It does not call order_send().")
print("=" * 62)
