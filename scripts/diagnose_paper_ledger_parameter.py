from pathlib import Path
import re

PROJECT_ROOT = Path(__file__).resolve().parents[1]

FILES = [
    PROJECT_ROOT / "src" / "services" / "execution_service.py",
    PROJECT_ROOT / "src" / "services" / "database_service.py",
]

print("=" * 70)
print("VOLSIM-PRO DATABASE PARAMETER DIAGNOSTIC")
print("=" * 70)

for path in FILES:

    print()
    print("=" * 70)
    print(f"SOURCE: {path}")
    print("=" * 70)

    if not path.exists():
        print("NOT FOUND")
        continue

    source = path.read_text(
        encoding="utf-8"
    )

    lines = source.splitlines()

    for number, line in enumerate(
        lines,
        start=1
    ):

        if (
            "database_service.execute" in line
            or "trade_ledger" in line
            or "$17" in line
            or "INSERT INTO" in line
        ):

            start = max(
                1,
                number - 8
            )

            end = min(
                len(lines),
                number + 35
            )

            print()
            print(
                f"--- CONTEXT AROUND LINE {number} ---"
            )

            for n in range(
                start,
                end + 1
            ):

                print(
                    f"{n:04d}: {lines[n - 1]}"
                )

print()
print("=" * 70)
print("SEARCHING ALL DATABASE EXECUTION CALLS")
print("=" * 70)

for path in PROJECT_ROOT.rglob("*.py"):

    try:
        source = path.read_text(
            encoding="utf-8"
        )
    except Exception:
        continue

    if (
        "database_service.execute" not in source
        and "asyncpg" not in source
    ):
        continue

    print()
    print(f"FILE: {path}")

    for number, line in enumerate(
        source.splitlines(),
        start=1
    ):

        if (
            "database_service.execute" in line
            or "asyncpg" in line
        ):

            print(
                f"{number:04d}: {line.strip()}"
            )

print()
print("=" * 70)
print("DIAGNOSTIC COMPLETE")
print("=" * 70)
