from pathlib import Path
import ast
import sys

ROOT = Path(__file__).resolve().parents[1]
EXECUTION_FILE = ROOT / "src" / "services" / "execution_service.py"

print("=" * 62)
print("VOLSIM-PRO STEP 3E")
print("BROKER TRANSMISSION BOUNDARY AUDIT")
print("=" * 62)
print("")

if not EXECUTION_FILE.exists():
    print(f"FAIL - execution service not found: {EXECUTION_FILE}")
    raise SystemExit(1)

source = EXECUTION_FILE.read_text(
    encoding="utf-8"
)

try:
    tree = ast.parse(source)
except SyntaxError as exc:
    print("FAIL - execution_service.py contains a syntax error.")
    print(exc)
    raise SystemExit(1)

print("PASS - execution_service.py parsed successfully.")
print("")

# --------------------------------------------------------------
# Locate MT5 transmission calls
# --------------------------------------------------------------

order_send_calls = []
order_check_calls = []

for node in ast.walk(tree):

    if isinstance(node, ast.Call):

        func = node.func

        if (
            isinstance(func, ast.Attribute)
            and func.attr == "order_send"
        ):
            order_send_calls.append(node)

        if (
            isinstance(func, ast.Attribute)
            and func.attr == "order_check"
        ):
            order_check_calls.append(node)


print("===== MT5 TRANSMISSION CALLS =====")

print(
    f"order_send() call sites: {len(order_send_calls)}"
)

print(
    f"order_check() call sites: {len(order_check_calls)}"
)

print("")

if not order_send_calls:
    print(
        "FAIL - no mt5.order_send() call was discovered."
    )
    raise SystemExit(1)

if len(order_send_calls) > 1:
    print(
        "WARNING - multiple order_send() call sites exist."
    )
else:
    print(
        "PASS - exactly one order_send() call site exists."
    )

print("")

# --------------------------------------------------------------
# Print source locations
# --------------------------------------------------------------

print("===== TRANSMISSION LOCATIONS =====")

for index, node in enumerate(order_send_calls, start=1):
    print(
        f"order_send #{index}: "
        f"line {node.lineno}"
    )

print("")

print("===== ORDER CHECK LOCATIONS =====")

for index, node in enumerate(order_check_calls, start=1):
    print(
        f"order_check #{index}: "
        f"line {node.lineno}"
    )

print("")

# --------------------------------------------------------------
# Search source for critical lifecycle markers
# --------------------------------------------------------------

required_markers = {
    "idempotency_claim": [
        "_claim_execution_idempotency",
        "client_order_id",
        "ON CONFLICT (client_order_id)",
    ],
    "idempotency_finalize": [
        "_finalize_execution_idempotency",
    ],
    "idempotency_release": [
        "_release_execution_idempotency",
    ],
    "broker_transmission": [
        "order_send",
    ],
    "broker_precheck": [
        "order_check",
    ],
    "unknown_transmission": [
        "TRANSMISSION_UNKNOWN",
    ],
    "execution_exception": [
        "EXECUTION_EXCEPTION",
    ],
}

print("===== EXECUTION LIFECYCLE MARKERS =====")

all_passed = True

for name, markers in required_markers.items():

    found = []

    for marker in markers:
        if marker in source:
            found.append(marker)

    if len(found) == len(markers):
        print(
            f"PASS - {name}: "
            + ", ".join(found)
        )
    else:
        missing = [
            marker
            for marker in markers
            if marker not in found
        ]

        print(
            f"FAIL - {name}: missing "
            + ", ".join(missing)
        )

        all_passed = False

print("")

# --------------------------------------------------------------
# Inspect functions containing broker transmission
# --------------------------------------------------------------

print("===== TRANSMISSION FUNCTION CONTEXT =====")

function_ranges = []

for node in ast.walk(tree):

    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):

        start = node.lineno
        end = getattr(
            node,
            "end_lineno",
            node.lineno,
        )

        for send_node in order_send_calls:

            if start <= send_node.lineno <= end:

                function_ranges.append(
                    (
                        node.name,
                        start,
                        end,
                        send_node.lineno,
                    )
                )

for (
    function_name,
    start,
    end,
    send_line,
) in function_ranges:

    print(
        f"order_send() is inside "
        f"{function_name}() "
        f"(lines {start}-{end}), "
        f"transmission line={send_line}"
    )

print("")

# --------------------------------------------------------------
# Print local source window around order_send()
# --------------------------------------------------------------

lines = source.splitlines()

for send_node in order_send_calls:

    line = send_node.lineno

    start = max(1, line - 20)
    end = min(len(lines), line + 25)

    print("=" * 62)
    print(
        f"SOURCE WINDOW AROUND order_send() "
        f"LINE {line}"
    )
    print("=" * 62)

    for number in range(start, end + 1):

        print(
            f"{number:5}: {lines[number - 1]}"
        )

    print("")

# --------------------------------------------------------------
# Static safety checks
# --------------------------------------------------------------

print("===== STATIC SAFETY CHECKS =====")

checks = []

# order_check must occur somewhere before order_send in source.
first_check = (
    min(node.lineno for node in order_check_calls)
    if order_check_calls
    else None
)

first_send = min(
    node.lineno
    for node in order_send_calls
)

if first_check is not None and first_check < first_send:
    checks.append(
        (
            True,
            "order_check() appears before "
            "order_send() in execution_service.py"
        )
    )
else:
    checks.append(
        (
            False,
            "order_check() does not appear before "
            "order_send()"
        )
    )

# Durable idempotency claim must occur before order_send.
claim_positions = [
    node.lineno
    for node in ast.walk(tree)
    if (
        isinstance(node, ast.Call)
        and isinstance(node.func, ast.Attribute)
        and node.func.attr
        == "_claim_execution_idempotency"
    )
]

if claim_positions and min(claim_positions) < first_send:
    checks.append(
        (
            True,
            "_claim_execution_idempotency() "
            "appears before order_send()"
        )
    )
else:
    checks.append(
        (
            False,
            "Unable to prove idempotency claim "
            "precedes order_send()"
        )
    )

# Finalization must exist after transmission.
finalize_positions = [
    node.lineno
    for node in ast.walk(tree)
    if (
        isinstance(node, ast.Call)
        and isinstance(node.func, ast.Attribute)
        and node.func.attr
        == "_finalize_execution_idempotency"
    )
]

if finalize_positions and max(finalize_positions) > first_send:
    checks.append(
        (
            True,
            "_finalize_execution_idempotency() "
            "exists after order_send()"
        )
    )
else:
    checks.append(
        (
            False,
            "Unable to prove execution finalization "
            "exists after order_send()"
        )
    )

# Release must exist, but release itself is not automatically unsafe.
release_positions = [
    node.lineno
    for node in ast.walk(tree)
    if (
        isinstance(node, ast.Call)
        and isinstance(node.func, ast.Attribute)
        and node.func.attr
        == "_release_execution_idempotency"
    )
]

if release_positions:
    checks.append(
        (
            True,
            "_release_execution_idempotency() "
            "exists for pre-transmission failure handling"
        )
    )
else:
    checks.append(
        (
            False,
            "No idempotency release path discovered"
        )
    )

for passed, message in checks:

    if passed:
        print(f"PASS - {message}")
    else:
        print(f"FAIL - {message}")
        all_passed = False

print("")

# --------------------------------------------------------------
# Important safety conclusion
# --------------------------------------------------------------

print("=" * 62)
print("STEP 3E STATIC AUDIT RESULT")
print("=" * 62)

if not all_passed:
    print("")
    print("FAIL - transmission boundary audit requires review.")
    print("")
    print("DO NOT transmit a live order.")
    print("=" * 62)
    raise SystemExit(1)

print("")
print("PASS - static transmission boundary checks passed.")
print("")
print("IMPORTANT:")
print("This audit performed NO MT5 order_check().")
print("This audit performed NO MT5 order_send().")
print("This audit transmitted NO broker order.")
print("")
print("STEP 3E STATIC AUDIT PASSED")
print("=" * 62)

raise SystemExit(0)
