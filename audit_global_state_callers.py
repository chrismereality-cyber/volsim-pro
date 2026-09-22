from pathlib import Path

root = Path(".")

patterns = [
    "global_state_orchestrator",
    "global_state_service",
    "global_trading_state_service",
]

exclude = [
    ".venv",
    "node_modules",
    ".next",
    "__pycache__",
    ".git",
    "backup",
    ".bak",
]

print("\n=== GLOBAL STATE CALLER AUDIT ===\n")

for pattern in patterns:

    print(f"\n### {pattern}")

    count = 0

    for path in root.rglob("*.py"):

        path_string = str(path)

        if any(x in path_string for x in exclude):
            continue

        try:
            text = path.read_text(encoding="utf-8")
        except Exception:
            continue

        for lineno, line in enumerate(text.splitlines(), 1):

            if pattern in line:

                print(
                    f"{path}:{lineno}: "
                    f"{line.strip()}"
                )

                count += 1

    print(f"TOTAL: {count}")

print("\n=== END AUDIT ===")
