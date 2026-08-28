from pathlib import Path
import ast
import sys

TARGET = Path("src/services/execution_service.py")

print("=" * 62)
print("VOLSIM-PRO STEP 3J.9.23")
print("REPAIR 3J.9.21 AUTHORIZATION ASSIGNMENT AUDIT")
print("=" * 62)

if not TARGET.exists():
    print("FAIL - execution_service.py not found.")
    sys.exit(1)

source = TARGET.read_text(encoding="utf-8-sig")

try:
    tree = ast.parse(source)
except SyntaxError as e:
    print(f"FAIL - execution_service.py syntax error: {e}")
    sys.exit(1)

send_order = None

for node in ast.walk(tree):
    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
        if node.name == "send_order":
            send_order = node
            break

if send_order is None:
    print("FAIL - send_order() not found.")
    sys.exit(1)

print(
    f"PASS - send_order() found: "
    f"lines {send_order.lineno}-{send_order.end_lineno}"
)

authorization_assignments = []
authorization_names = []

for node in ast.walk(send_order):

    if isinstance(node, ast.Assign):
        targets = node.targets

        for target in targets:
            if (
                isinstance(target, ast.Name)
                and target.id == "live_transmission_authorized"
            ):
                authorization_assignments.append(node)

    elif isinstance(node, ast.AnnAssign):
        target = node.target

        if (
            isinstance(target, ast.Name)
            and target.id == "live_transmission_authorized"
        ):
            authorization_assignments.append(node)

    elif isinstance(node, ast.NamedExpr):
        target = node.target

        if (
            isinstance(target, ast.Name)
            and target.id == "live_transmission_authorized"
        ):
            authorization_assignments.append(node)

print("")
print("===== AUTHORIZATION ASSIGNMENT DETECTION =====")

for node in authorization_assignments:
    print(
        "authorization assignment:",
        f"line {node.lineno}"
    )

if len(authorization_assignments) != 1:
    print("")
    print(
        "FAIL - expected exactly one "
        "live_transmission_authorized assignment."
    )
    print(
        f"FOUND: {len(authorization_assignments)}"
    )
    sys.exit(1)

auth_node = authorization_assignments[0]

print(
    "PASS - exactly one "
    "live_transmission_authorized assignment."
)

# ------------------------------------------------------------
# Verify literal-True authorization semantics
# ------------------------------------------------------------

authorization_is_literal_true = False

value = getattr(auth_node, "value", None)

if isinstance(value, ast.Compare):

    if len(value.ops) == 1 and isinstance(
        value.ops[0],
        ast.Is
    ):

        if len(value.comparators) == 1:

            comparator = value.comparators[0]

            if (
                isinstance(comparator, ast.Constant)
                and comparator.value is True
            ):
                authorization_is_literal_true = True

if not authorization_is_literal_true:
    print(
        "FAIL - authorization does not use literal "
        "True comparison."
    )
    sys.exit(1)

print(
    "PASS - authorization requires literal True."
)

# ------------------------------------------------------------
# Locate authorization guard
# ------------------------------------------------------------

authorization_ifs = []

for node in ast.walk(send_order):

    if isinstance(node, ast.If):

        try:
            source_test = ast.unparse(node.test)
        except Exception:
            source_test = ""

        if source_test == "not live_transmission_authorized":

            authorization_ifs.append(node)

print("")

if len(authorization_ifs) != 1:
    print(
        "FAIL - expected exactly one "
        "'if not live_transmission_authorized' block."
    )
    print(
        f"FOUND: {len(authorization_ifs)}"
    )
    sys.exit(1)

authorization_if = authorization_ifs[0]

print(
    "PASS - exactly one authorization rejection block found:",
    f"lines {authorization_if.lineno}-"
    f"{authorization_if.end_lineno}"
)

# ------------------------------------------------------------
# Find executable call sites
# ------------------------------------------------------------

def find_calls(function_node, function_name):

    result = []

    for node in ast.walk(function_node):

        if not isinstance(node, ast.Call):
            continue

        func = node.func

        if (
            isinstance(func, ast.Attribute)
            and func.attr == function_name
        ):
            result.append(node)

    return result


risk_calls = []

for node in ast.walk(send_order):

    if isinstance(node, ast.Call):

        func = node.func

        if (
            isinstance(func, ast.Attribute)
            and func.attr == "approve_order"
        ):
            risk_calls.append(node)

guard_calls = []

for node in ast.walk(send_order):

    if isinstance(node, ast.Call):

        func = node.func

        if (
            isinstance(func, ast.Attribute)
            and func.attr == "evaluate"
        ):
            guard_calls.append(node)

order_check_calls = find_calls(
    send_order,
    "order_check"
)

order_send_calls = find_calls(
    send_order,
    "order_send"
)

print("")
print("===== EXECUTABLE CALL INVENTORY =====")

print(
    "risk approval     :",
    [n.lineno for n in risk_calls]
)

print(
    "market guard      :",
    [n.lineno for n in guard_calls]
)

print(
    "order_check       :",
    [n.lineno for n in order_check_calls]
)

print(
    "order_send        :",
    [n.lineno for n in order_send_calls]
)

if len(risk_calls) != 1:
    print("FAIL - expected exactly one risk approval call.")
    sys.exit(1)

if len(guard_calls) != 1:
    print("FAIL - expected exactly one market guard call.")
    sys.exit(1)

if len(order_check_calls) != 1:
    print("FAIL - expected exactly one order_check() call.")
    sys.exit(1)

if len(order_send_calls) != 1:
    print("FAIL - expected exactly one order_send() call.")
    sys.exit(1)

risk_line = risk_calls[0].lineno
guard_line = guard_calls[0].lineno
check_line = order_check_calls[0].lineno
send_line = order_send_calls[0].lineno
auth_line = auth_node.lineno

print("")
print("===== FINAL STRUCTURAL ORDER =====")

print(f"authorization : {auth_line}")
print(f"risk          : {risk_line}")
print(f"market_guard  : {guard_line}")
print(f"order_check   : {check_line}")
print(f"order_send    : {send_line}")

checks = [
    (
        auth_line < risk_line,
        "authorization precedes risk approval."
    ),
    (
        risk_line < guard_line,
        "risk approval precedes market context."
    ),
    (
        guard_line < check_line,
        "market context precedes order_check()."
    ),
    (
        check_line < send_line,
        "order_check() precedes order_send()."
    ),
]

for passed, message in checks:

    if passed:
        print(f"PASS - {message}")
    else:
        print(f"FAIL - {message}")
        sys.exit(1)

print("")
print("=" * 62)
print("STEP 3J.9.23 PASSED")
print("=" * 62)
print("The source is structurally valid.")
print("The authorization audit detector is compatible with")
print("the current execution_service.py AST.")
print("")
print("NO SOURCE WAS MODIFIED.")
print("NO MT5 CONNECTION WAS OPENED.")
print("NO BROKER ORDER WAS TRANSMITTED.")
print("=" * 62)

sys.exit(0)
