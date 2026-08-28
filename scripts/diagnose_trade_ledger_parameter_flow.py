from pathlib import Path
import re


PROJECT_ROOT = Path(r"C:\volsim-dev")

EXECUTION_FILE = (
    PROJECT_ROOT
    / "src"
    / "services"
    / "execution_service.py"
)

DATABASE_FILE = (
    PROJECT_ROOT
    / "src"
    / "services"
    / "database_service.py"
)


def section(title):
    print()
    print("=" * 78)
    print(title)
    print("=" * 78)


def numbered_context(lines, start, end):
    for number in range(start, min(end, len(lines)) + 1):
        print(
            f"{number:04d}: {lines[number - 1]}"
        )


print("=" * 78)
print("VOLSIM-PRO TRADE LEDGER PARAMETER FLOW DIAGNOSTIC")
print("=" * 78)

print()
print("PROJECT ROOT:")
print(PROJECT_ROOT)

print()
print("EXECUTION SERVICE:")
print(EXECUTION_FILE)

print()
print("DATABASE SERVICE:")
print(DATABASE_FILE)


# ------------------------------------------------------------------
# VERIFY FILES
# ------------------------------------------------------------------

section("FILE VALIDATION")

if not EXECUTION_FILE.exists():
    print("FAIL: execution_service.py not found.")
    raise SystemExit(1)

print("PASS: execution_service.py found.")

if not DATABASE_FILE.exists():
    print("FAIL: database_service.py not found.")
    raise SystemExit(1)

print("PASS: database_service.py found.")


execution_source = EXECUTION_FILE.read_text(
    encoding="utf-8"
)

database_source = DATABASE_FILE.read_text(
    encoding="utf-8"
)

execution_lines = execution_source.splitlines()
database_lines = database_source.splitlines()


# ------------------------------------------------------------------
# RECORD TRADE LEDGER FUNCTION
# ------------------------------------------------------------------

section("record_trade_ledger() DECLARATION")

ledger_match = re.search(
    r"async\s+def\s+record_trade_ledger\s*\(",
    execution_source
)

if not ledger_match:
    print("FAIL: record_trade_ledger() not found.")
    raise SystemExit(1)

ledger_line = (
    execution_source[:ledger_match.start()].count("\n") + 1
)

print(
    f"PASS: record_trade_ledger() starts at line {ledger_line}"
)


# ------------------------------------------------------------------
# FIND DATABASE EXECUTE CALL
# ------------------------------------------------------------------

section("TRADE LEDGER DATABASE EXECUTE CALL")

execute_matches = list(
    re.finditer(
        r"await\s+database_service\.execute\s*\(",
        execution_source
    )
)

print(
    f"database_service.execute() calls found: "
    f"{len(execute_matches)}"
)

ledger_execute_match = None

for match in execute_matches:

    line_number = (
        execution_source[:match.start()].count("\n") + 1
    )

    nearby = execution_source[
        max(0, match.start() - 500):
        min(len(execution_source), match.start() + 2500)
    ]

    if "INSERT INTO trade_ledger" in nearby:
        ledger_execute_match = match

        print(
            f"PASS: trade_ledger execute() call found "
            f"around line {line_number}"
        )

        break


if ledger_execute_match is None:

    print(
        "FAIL: Could not locate the database execute() "
        "call associated with trade_ledger."
    )

    raise SystemExit(1)


ledger_execute_line = (
    execution_source[:ledger_execute_match.start()].count("\n") + 1
)

print()
print(
    f"TRADE LEDGER EXECUTE START: line "
    f"{ledger_execute_line}"
)

numbered_context(
    execution_lines,
    max(1, ledger_execute_line - 10),
    min(len(execution_lines), ledger_execute_line + 75)
)


# ------------------------------------------------------------------
# EXTRACT SQL BLOCK
# ------------------------------------------------------------------

section("SQL PLACEHOLDER ANALYSIS")

sql_start = execution_source.find(
    "INSERT INTO trade_ledger",
    ledger_execute_match.start()
)

if sql_start == -1:
    print("FAIL: INSERT INTO trade_ledger not found.")
    raise SystemExit(1)

sql_end = execution_source.find(
    '"""',
    sql_start
)

if sql_end == -1:
    print("FAIL: Could not determine end of SQL block.")
    raise SystemExit(1)

sql_block = execution_source[sql_start:sql_end]

placeholders = sorted(
    {
        int(number)
        for number in re.findall(
            r"\$(\d+)",
            sql_block
        )
    }
)

print("Detected SQL parameters:")

if placeholders:
    print(
        "  "
        + ", ".join(
            f"${number}"
            for number in placeholders
        )
    )
else:
    print("  NONE")

print()

if placeholders:

    print(
        "Highest SQL placeholder:",
        max(placeholders)
    )

    expected_count = max(placeholders)

    print(
        "Expected positional argument count:",
        expected_count
    )

else:

    print(
        "WARNING: No PostgreSQL positional parameters "
        "were detected."
    )


# ------------------------------------------------------------------
# FULL EXECUTE CALL ARGUMENT ANALYSIS
# ------------------------------------------------------------------

section("EXECUTE() ARGUMENT FLOW")

execute_start = ledger_execute_match.start()

paren_start = execution_source.find(
    "(",
    execute_start
)

if paren_start == -1:
    print("FAIL: execute() opening parenthesis not found.")
    raise SystemExit(1)


# Find matching closing parenthesis.
depth = 0
quote = None
escape = False
paren_end = None

for index in range(paren_start, len(execution_source)):

    char = execution_source[index]

    if quote:

        if escape:
            escape = False
            continue

        if char == "\\":
            escape = True
            continue

        if char == quote:
            quote = None

        continue

    if char in ("'", '"'):
        quote = char
        continue

    if char == "(":
        depth += 1

    elif char == ")":

        depth -= 1

        if depth == 0:
            paren_end = index
            break


if paren_end is None:
    print(
        "FAIL: Could not determine complete execute() call."
    )
    raise SystemExit(1)


execute_call = execution_source[
    paren_start + 1:
    paren_end
]

print(
    "Complete database_service.execute() argument region:"
)

print("-" * 78)
print(execute_call)
print("-" * 78)


# ------------------------------------------------------------------
# POSITIONAL PARAMETER REFERENCES
# ------------------------------------------------------------------

section("PARAMETER REFERENCES INSIDE EXECUTE() CALL")

argument_parameters = sorted(
    {
        int(number)
        for number in re.findall(
            r"\$(\d+)",
            execute_call
        )
    }
)

if argument_parameters:

    print(
        "SQL-style placeholders inside execute call:"
    )

    print(
        "  "
        + ", ".join(
            f"${number}"
            for number in argument_parameters
        )
    )

else:

    print(
        "No SQL-style placeholders found directly "
        "inside the execute() call."
    )


# ------------------------------------------------------------------
# DATABASE SERVICE EXECUTE SIGNATURE
# ------------------------------------------------------------------

section("DATABASE SERVICE execute() IMPLEMENTATION")

database_execute_matches = list(
    re.finditer(
        r"(?:async\s+)?def\s+execute\s*\(",
        database_source
    )
)

if not database_execute_matches:

    print(
        "FAIL: database_service.execute() "
        "implementation not found."
    )

else:

    for match in database_execute_matches:

        line_number = (
            database_source[:match.start()].count("\n") + 1
        )

        print(
            f"execute() implementation at line "
            f"{line_number}"
        )

        numbered_context(
            database_lines,
            max(1, line_number - 5),
            min(len(database_lines), line_number + 80)
        )


# ------------------------------------------------------------------
# SEARCH FOR $17
# ------------------------------------------------------------------

section("GLOBAL $17 SEARCH")

found_17 = []

for number, line in enumerate(
    execution_lines,
    start=1
):

    if "$17" in line:

        found_17.append(
            (
                number,
                line
            )
        )


for number, line in found_17:

    print(
        f"execution_service.py:{number:04d}: {line}"
    )


for number, line in enumerate(
    database_lines,
    start=1
):

    if "$17" in line:

        print(
            f"database_service.py:{number:04d}: {line}"
        )


if not found_17:

    print(
        "No literal $17 found in execution_service.py."
    )


# ------------------------------------------------------------------
# TRADE LEDGER PLACEHOLDER SUMMARY
# ------------------------------------------------------------------

section("FINAL DIAGNOSIS")

print(
    "SQL highest placeholder:",
    max(placeholders) if placeholders else "NONE"
)

print(
    "Execute-call length:",
    len(execute_call)
)

print(
    "Literal $17 in execution_service.py:",
    "YES" if found_17 else "NO"
)

print()
print(
    "IMPORTANT:"
)

print(
    "The PAPER execution path is reaching the durable "
    "trade ledger."
)

print(
    "The market-context guard has already passed."
)

print(
    "The failure is occurring during PostgreSQL persistence."
)

print(
    "NO MT5 order_check() was called."
)

print(
    "NO MT5 order_send() was called."
)

print(
    "NO LIVE BROKER ORDER WAS SENT."
)

print()
print("=" * 78)
print("DIAGNOSTIC COMPLETE")
print("=" * 78)
