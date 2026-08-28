from pathlib import Path
import re

PROJECT_ROOT = Path(__file__).resolve().parents[1]
SRC = PROJECT_ROOT / "src"

print("=" * 78)
print("VOLSIM-PRO DATABASE PARAMETER / $17 RUNTIME SOURCE TRACE")
print("=" * 78)

print()
print("PROJECT ROOT:")
print(PROJECT_ROOT)

print()
print("=" * 78)
print("1. ALL LITERAL $17 REFERENCES")
print("=" * 78)

found_17 = []

for path in SRC.rglob("*.py"):
    try:
        text = path.read_text(encoding="utf-8")
    except Exception:
        continue

    for number, line in enumerate(text.splitlines(), start=1):
        if "$17" in line:
            found_17.append((path, number, line.strip()))

if not found_17:
    print("NO literal $17 references found under src/.")
else:
    for path, number, line in found_17:
        print(f"{path}:{number}: {line}")

print()
print("=" * 78)
print("2. DATABASE SERVICE EXECUTE CALLS")
print("=" * 78)

execute_pattern = re.compile(
    r"database_service\.execute\s*\("
)

for path in SRC.rglob("*.py"):

    try:
        lines = path.read_text(
            encoding="utf-8"
        ).splitlines()
    except Exception:
        continue

    for number, line in enumerate(lines, start=1):

        if execute_pattern.search(line):

            print()
            print(f"FILE: {path}")
            print(f"LINE: {number}")

            start = max(1, number - 2)
            end = min(len(lines), number + 20)

            for n in range(start, end + 1):
                print(
                    f"{n:04d}: {lines[n-1]}"
                )

print()
print("=" * 78)
print("3. ALL asyncpg CONNECTION EXECUTE CALLS")
print("=" * 78)

for path in SRC.rglob("*.py"):

    try:
        lines = path.read_text(
            encoding="utf-8"
        ).splitlines()
    except Exception:
        continue

    for number, line in enumerate(lines, start=1):

        if (
            ".execute(" in line
            or "conn.execute" in line
            or "connection.execute" in line
        ):

            print(
                f"{path}:{number}: {line.strip()}"
            )

print()
print("=" * 78)
print("4. SERVICES MOST LIKELY INVOLVED")
print("=" * 78)

service_names = [
    "execution_service.py",
    "database_service.py",
    "oms_service.py",
    "position_service.py",
    "risk_service.py",
    "wallet_service.py",
]

for name in service_names:

    matches = list(
        SRC.rglob(name)
    )

    if matches:

        for path in matches:

            print()
            print(f"FOUND: {path}")

            try:
                text = path.read_text(
                    encoding="utf-8"
                )
            except Exception:
                continue

            placeholders = sorted(
                set(
                    re.findall(
                        r"\$(\d+)",
                        text
                    ),
                    key=lambda x: int(x)
                )
            )

            if placeholders:

                print(
                    "SQL placeholders:",
                    ", ".join(
                        "$" + x
                        for x in placeholders
                    )
                )

                print(
                    "Highest placeholder:",
                    max(
                        int(x)
                        for x in placeholders
                    )
                )

            else:

                print(
                    "No PostgreSQL $N placeholders found."
                )

print()
print("=" * 78)
print("5. ALL TRADE LEDGER REFERENCES")
print("=" * 78)

for path in SRC.rglob("*.py"):

    try:
        lines = path.read_text(
            encoding="utf-8"
        ).splitlines()
    except Exception:
        continue

    for number, line in enumerate(lines, start=1):

        if "trade_ledger" in line:

            print(
                f"{path}:{number}: {line.strip()}"
            )

print()
print("=" * 78)
print("TRACE COMPLETE")
print("=" * 78)
print()
print("NO DATABASE CONNECTION WAS CREATED.")
print("NO INSERT WAS PERFORMED.")
print("NO UPDATE WAS PERFORMED.")
print("NO DELETE WAS PERFORMED.")
print("NO MT5 INITIALIZATION WAS PERFORMED.")
print("NO BROKER ORDER WAS SENT.")
print()
