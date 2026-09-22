from pathlib import Path

root = Path("src")

targets = [
    "global_trading_state_service",
    "global_state_service",
    "global_state_orchestrator",
]

print("\n=== GLOBAL STATE ARCHITECTURE AUDIT ===\n")

for target in targets:
    print(f"\n--- REFERENCES: {target} ---")

    found = False

    for path in root.rglob("*.py"):
        if "__pycache__" in str(path):
            continue

        try:
            text = path.read_text(encoding="utf-8")
        except Exception:
            continue

        for lineno, line in enumerate(text.splitlines(), 1):
            if target in line:
                print(f"{path}:{lineno}: {line.strip()}")
                found = True

    if not found:
        print("NONE")

print("\n=== IMPORT GRAPH CHECK ===\n")

checks = {
    "global_trading_state_service -> risk_service":
        (
            "src/services/global_trading_state_service.py",
            "from src.services.risk_service"
        ),

    "risk_service -> global_trading_state_service":
        (
            "src/services/risk_service.py",
            "global_trading_state_service"
        ),

    "global_trading_state_service -> portfolio_service":
        (
            "src/services/global_trading_state_service.py",
            "portfolio_service"
        ),

    "portfolio_service -> global_trading_state_service":
        (
            "src/services/portfolio_service.py",
            "global_trading_state_service"
        ),

    "global_trading_state_service -> vault_service":
        (
            "src/services/global_trading_state_service.py",
            "vault_service"
        ),

    "vault_service -> global_trading_state_service":
        (
            "src/services/vault_service.py",
            "global_trading_state_service"
        ),
}

for name, (file, needle) in checks.items():

    path = Path(file)

    if not path.exists():
        print(f"NOT FOUND: {file}")
        continue

    text = path.read_text(encoding="utf-8")

    if needle in text:
        print(f"WARNING: {name}")
    else:
        print(f"PASS: {name}")

print("\n=== AUDIT COMPLETE ===")
