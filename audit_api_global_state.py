from pathlib import Path

path = Path("src/api/main.py")

lines = path.read_text(encoding="utf-8-sig").splitlines()

print("\n=== API GLOBAL STATE REFERENCES ===\n")

for i, line in enumerate(lines, 1):

    if any(
        term in line
        for term in [
            "global_trading_state_service",
            "global_state_service",
            "global_state_orchestrator",
            "trading-state",
            "trading_state",
            "snapshot()",
        ]
    ):
        print(f"{i:4}: {line}")

print("\n=== END API AUDIT ===\n")
