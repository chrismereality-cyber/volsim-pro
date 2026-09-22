"""
VolSim-Pro Immutable Vault / Allocation Dependency Audit

Purpose:
- Verify application-side references to allocation_profiles
- Verify canonical 70/30 allocation configuration
- Inspect active vault implementation
- DO NOT modify database state
- DO NOT modify production trading logic
"""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]

SEARCH_ROOTS = [
    ROOT / "src",
    ROOT / "alembic",
    ROOT / "cpp_core",
    ROOT / "tools",
]

PATTERNS = [
    r"allocation_profiles",
    r"get_active_allocation",
    r"process_profit_allocation",
    r"trading_equity_pct",
    r"vault_pct",
    r"allocation_profile",
    r"TRADING_EQUITY_PERCENTAGE",
    r"VAULT_PERCENTAGE",
    r"CORE_SATELLITE_70_30",
]

EXCLUDE_DIRS = {
    "__pycache__",
    ".git",
    ".venv",
    "node_modules",
}

EXTENSIONS = {
    ".py",
    ".sql",
    ".md",
    ".json",
    ".yaml",
    ".yml",
    ".toml",
}

def scan_file(path: Path):
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return []

    matches = []

    for number, line in enumerate(text.splitlines(), start=1):
        for pattern in PATTERNS:
            if re.search(pattern, line, re.IGNORECASE):
                matches.append((number, line.strip(), pattern))
                break

    return matches


def main():
    print("=" * 80)
    print("VOLSIM-PRO ALLOCATION / IMMUTABLE VAULT DEPENDENCY AUDIT")
    print("=" * 80)
    print(f"Repository: {ROOT}")
    print()

    results = []

    for search_root in SEARCH_ROOTS:
        if not search_root.exists():
            continue

        for path in search_root.rglob("*"):
            if not path.is_file():
                continue

            if path.suffix.lower() not in EXTENSIONS:
                continue

            if any(part in EXCLUDE_DIRS for part in path.parts):
                continue

            matches = scan_file(path)

            if matches:
                results.append((path, matches))

    if not results:
        print("No matching allocation/vault references found.")
        return

    for path, matches in sorted(results):
        relative = path.relative_to(ROOT)

        print("-" * 80)
        print(relative)

        for line_number, line, pattern in matches:
            print(f"  L{line_number:<5} [{pattern}] {line}")

    print()
    print("=" * 80)
    print(f"FILES WITH MATCHES: {len(results)}")
    print("=" * 80)


if __name__ == "__main__":
    main()
