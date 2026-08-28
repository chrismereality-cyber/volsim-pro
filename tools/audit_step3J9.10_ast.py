from pathlib import Path
import ast
import sys

SOURCE = Path("src/services/execution_service.py")

print("=" * 62)
print("VOLSIM-PRO STEP 3J.9.10")
print("CORRECT AST EXECUTION ORDER AUDIT")
print("=" * 62)
print()

if not SOURCE.exists():
    print("FAIL - execution_service.py not found.")
    sys.exit(1)

source = SOURCE.read_text(encoding="utf-8")

try:
    tree = ast.parse(source)
except SyntaxError as exc:
    print(f"FAIL - execution_service.py has syntax error: {exc}")
    sys.exit(1)

print("PASS - execution_service.py parses successfully.")
print()

# ------------------------------------------------------------------
# Locate send_order()
# ------------------------------------------------------------------

send_order_node = None

for node in tree.body:
    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
        if node.name == "send_order":
            send_order_node = node
            break

if send_order_node is None:

    class SendOrderVisitor(ast.NodeVisitor):
        def visit_FunctionDef(self, node):
            global send_order_node
            if node.name == "send_order":
                send_order_node = node
            self.generic_visit(node)

        def visit_AsyncFunctionDef(self, node):
            global send_order_node
            if node.name == "send_order":
                send_order_node = node
            self.generic_visit(node)

    SendOrderVisitor().visit(tree)

if send_order_node is None:
    print("FAIL - send_order() not found.")
    sys.exit(1)

print(
    f"PASS - send_order() found: "
    f"lines {send_order_node.lineno}-{getattr(send_order_node, 'end_lineno', '?')}"
)
print()

# ------------------------------------------------------------------
# AST helpers
# ------------------------------------------------------------------

def is_attribute_call(node, object_name, method_name):
    return (
        isinstance(node, ast.Call)
        and isinstance(node.func, ast.Attribute)
        and node.func.attr == method_name
        and isinstance(node.func.value, ast.Name)
        and node.func.value.id == object_name
    )

def find_calls(node, object_name, method_name):
    matches = []

    for child in ast.walk(node):

        if is_attribute_call(
            child,
            object_name,
            method_name
        ):
            matches.append(child)

    return matches

# ------------------------------------------------------------------
# Locate ONLY executable MT5 calls inside send_order()
# ------------------------------------------------------------------

order_check_calls = find_calls(
    send_order_node,
    "mt5",
    "order_check"
)

order_send_calls = find_calls(
    send_order_node,
    "mt5",
    "order_send"
)

print("===== EXECUTABLE MT5 CALL SITES =====")
print()

print(
    "MT5 order_check() AST call sites:",
    len(order_check_calls)
)

for node in order_check_calls:
    print(
        f"  order_check() executable call: "
        f"line {node.lineno}"
    )

print()

print(
    "MT5 order_send() AST call sites:",
    len(order_send_calls)
)

for node in order_send_calls:
    print(
        f"  order_send() executable call: "
        f"line {node.lineno}"
    )

print()

# ------------------------------------------------------------------
# Locate authorization
# ------------------------------------------------------------------

authorization_line = None

for node in ast.walk(send_order_node):

    if isinstance(node, ast.Assign):

        for target in node.targets:

            if (
                isinstance(target, ast.Name)
                and target.id == "live_transmission_authorized"
            ):
                authorization_line = node.lineno

    elif isinstance(node, ast.AnnAssign):

        if (
            isinstance(node.target, ast.Name)
            and node.target.id == "live_transmission_authorized"
        ):
            authorization_line = node.lineno

# ------------------------------------------------------------------
# Locate risk approval
# ------------------------------------------------------------------

risk_lines = []

for node in ast.walk(send_order_node):

    if isinstance(node, ast.Call):

        func = node.func

        if (
            isinstance(func, ast.Attribute)
            and func.attr == "approve_order"
        ):
            risk_lines.append(node.lineno)

# ------------------------------------------------------------------
# Locate market context
# ------------------------------------------------------------------

market_context_lines = []

for node in ast.walk(send_order_node):

    if isinstance(node, ast.Call):

        func = node.func

        if (
            isinstance(func, ast.Attribute)
            and func.attr == "evaluate"
        ):

            # Only count calls associated with execution_guard_service.
            if (
                isinstance(func.value, ast.Name)
                and func.value.id == "execution_guard_service"
            ):
                market_context_lines.append(node.lineno)

# ------------------------------------------------------------------
# Locate OMS order creation
# ------------------------------------------------------------------

oms_create_lines = []

for node in ast.walk(send_order_node):

    if isinstance(node, ast.Call):

        func = node.func

        if (
            isinstance(func, ast.Attribute)
            and func.attr == "create_order"
            and isinstance(func.value, ast.Name)
            and func.value.id == "oms_service"
        ):
            oms_create_lines.append(node.lineno)

# ------------------------------------------------------------------
# Locate order_check/order_send using actual AST calls
# ------------------------------------------------------------------

order_check_line = (
    min(node.lineno for node in order_check_calls)
    if order_check_calls
    else None
)

order_send_line = (
    min(node.lineno for node in order_send_calls)
    if order_send_calls
    else None
)

risk_line = (
    min(risk_lines)
    if risk_lines
    else None
)

market_context_line = (
    min(market_context_lines)
    if market_context_lines
    else None
)

oms_create_line = (
    min(oms_create_lines)
    if oms_create_lines
    else None
)

print("===== ACTUAL EXECUTION ORDER =====")
print()

print(
    f"OMS create       : "
    f"{oms_create_line}"
)

print(
    f"authorization    : "
    f"{authorization_line}"
)

print(
    f"risk approval    : "
    f"{risk_line}"
)

print(
    f"market context   : "
    f"{market_context_line}"
)

print(
    f"order_check()    : "
    f"{order_check_line}"
)

print(
    f"order_send()     : "
    f"{order_send_line}"
)

print()

# ------------------------------------------------------------------
# Structural validation
# ------------------------------------------------------------------

failed = False

def require_exists(label, value):
    global failed

    if value is None:
        print(f"FAIL - {label} not found.")
        failed = True
    else:
        print(f"PASS - {label} found.")

require_exists("OMS create", oms_create_line)
require_exists("authorization", authorization_line)
require_exists("risk approval", risk_line)
require_exists("market context", market_context_line)
require_exists("order_check()", order_check_line)
require_exists("order_send()", order_send_line)

print()

# ------------------------------------------------------------------
# Authorization must precede risk
# ------------------------------------------------------------------

if (
    authorization_line is not None
    and risk_line is not None
):

    if authorization_line < risk_line:
        print(
            "PASS - authorization precedes risk approval."
        )
    else:
        print(
            "FAIL - authorization does not precede risk approval."
        )
        failed = True

# ------------------------------------------------------------------
# Risk must precede market context
# ------------------------------------------------------------------

if (
    risk_line is not None
    and market_context_line is not None
):

    if risk_line < market_context_line:
        print(
            "PASS - risk approval precedes market context."
        )
    else:
        print(
            "FAIL - risk approval does not precede market context."
        )
        failed = True

# ------------------------------------------------------------------
# Market context must precede order_check
# ------------------------------------------------------------------

if (
    market_context_line is not None
    and order_check_line is not None
):

    if market_context_line < order_check_line:
        print(
            "PASS - market context precedes order_check()."
        )
    else:
        print(
            "FAIL - market context does not precede order_check()."
        )
        failed = True

# ------------------------------------------------------------------
# order_check MUST precede actual order_send
# ------------------------------------------------------------------

if (
    order_check_line is not None
    and order_send_line is not None
):

    if order_check_line < order_send_line:

        print(
            "PASS - order_check() precedes executable order_send()."
        )

    else:

        print(
            "FAIL - order_check() does not precede "
            "executable order_send()."
        )

        failed = True

# ------------------------------------------------------------------
# Exactly one executable order_send
# ------------------------------------------------------------------

if len(order_send_calls) == 1:

    print(
        "PASS - exactly one executable mt5.order_send() exists."
    )

else:

    print(
        "FAIL - expected exactly one executable "
        f"mt5.order_send(); found {len(order_send_calls)}."
    )

    failed = True

# ------------------------------------------------------------------
# Exactly one executable order_check
# ------------------------------------------------------------------

if len(order_check_calls) == 1:

    print(
        "PASS - exactly one executable mt5.order_check() exists."
    )

else:

    print(
        "FAIL - expected exactly one executable "
        f"mt5.order_check(); found {len(order_check_calls)}."
    )

    failed = True

# ------------------------------------------------------------------
# Verify literal True authorization semantics
# ------------------------------------------------------------------

authorization_source = None

if authorization_line is not None:

    lines = source.splitlines()

    start = max(0, authorization_line - 1)
    end = min(len(lines), authorization_line + 12)

    authorization_source = "\n".join(
        lines[start:end]
    )

if authorization_source:

    if (
        "live_transmission_authorized" in authorization_source
        and "is True" in authorization_source
    ):

        print(
            "PASS - authorization requires literal True."
        )

    else:

        print(
            "FAIL - literal-True authorization condition "
            "could not be confirmed."
        )

        failed = True

print()

# ------------------------------------------------------------------
# Safety statement
# ------------------------------------------------------------------

print("===== SAFETY RESULT =====")
print()

if failed:

    print("STEP 3J.9.10 FAILED")
    print("DO NOT proceed to live order transmission.")
    print("No source was modified by this audit.")
    sys.exit(1)

print("STEP 3J.9.10 PASSED")
print("AST execution ordering is structurally valid.")
print("No source was modified by this audit.")
print("DO NOT run live transmission until the next runtime tests pass.")

sys.exit(0)
