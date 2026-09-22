from pathlib import Path
import ast

FILES = [
    Path("src/services/global_trading_state_service.py"),
    Path("src/services/portfolio_service.py"),
    Path("src/services/risk_service.py"),
    Path("src/services/vault_service.py"),
    Path("src/services/global_state_service.py"),
]

print("\n=== CANONICAL STATE DEPENDENCY AUDIT ===\n")

for path in FILES:

    print(f"\n{'=' * 80}")
    print(f"FILE: {path}")
    print(f"{'=' * 80}")

    if not path.exists():
        print("NOT FOUND")
        continue

    source = path.read_text(encoding="utf-8")

    try:
        tree = ast.parse(source)
    except Exception as exc:
        print(f"AST PARSE ERROR: {exc}")
        continue

    imports = []

    for node in ast.walk(tree):

        if isinstance(node, ast.Import):

            for alias in node.names:
                imports.append(alias.name)

        elif isinstance(node, ast.ImportFrom):

            module = node.module or ""

            for alias in node.names:
                imports.append(
                    f"{module}.{alias.name}"
                )

    if not imports:
        print("NO IMPORTS FOUND")
    else:
        for item in sorted(set(imports)):
            print(item)

print("\n\n=== CRITICAL EDGE CHECK ===\n")

edges = {
    "GLOBAL -> PORTFOLIO":
        (
            "src/services/global_trading_state_service.py",
            "src.services.portfolio_service"
        ),

    "PORTFOLIO -> GLOBAL":
        (
            "src/services/portfolio_service.py",
            "src.services.global_trading_state_service"
        ),

    "GLOBAL -> RISK":
        (
            "src/services/global_trading_state_service.py",
            "src.services.risk_service"
        ),

    "RISK -> GLOBAL":
        (
            "src/services/risk_service.py",
            "src.services.global_trading_state_service"
        ),

    "GLOBAL -> VAULT":
        (
            "src/services/global_trading_state_service.py",
            "src.services.vault_service"
        ),

    "VAULT -> GLOBAL":
        (
            "src/services/vault_service.py",
            "src.services.global_trading_state_service"
        ),
}

for name, (file, module) in edges.items():

    path = Path(file)

    if not path.exists():
        print(f"{name}: FILE NOT FOUND")
        continue

    source = path.read_text(encoding="utf-8")

    try:
        tree = ast.parse(source)
    except Exception as exc:
        print(f"{name}: AST ERROR {exc}")
        continue

    found = False

    for node in ast.walk(tree):

        if isinstance(node, ast.Import):

            for alias in node.names:
                if alias.name == module:
                    found = True

        elif isinstance(node, ast.ImportFrom):

            if node.module == module:
                found = True

    if found:
        print(f"FOUND:   {name}")
    else:
        print(f"CLEAN:   {name}")

print("\n=== AUDIT COMPLETE ===\n")
