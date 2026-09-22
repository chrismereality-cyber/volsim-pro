"""
VolSim-Pro Immutable Vault Contract Audit

READ-ONLY SOURCE AUDIT.

Checks:
1. Canonical 70/30 allocation policy.
2. VaultService references to database columns.
3. Known immutable_vault_state schema expectations.
4. Legacy allocation_profiles references.
5. Potential last_realized_profit schema mismatch.

No database changes.
No trading changes.
No git operations.
"""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]

VAULT_SERVICE = ROOT / "src" / "services" / "vault_service.py"
ALLOCATION_POLICY = ROOT / "src" / "config" / "allocation_policy.py"

EXPECTED_IMMUTABLE_VAULT_COLUMNS = {
    "id",
    "trading_equity_balance",
    "vault_balance",
    "state_hash",
    "last_updated",
    "allocation_profile",
    "equity_percentage",
    "vault_percentage",
    "pending_vault_allocation",
    "total_allocated",
    "total_transferred",
    "sync_status",
    "wallet_address",
    "blockchain_network",
    "last_tx_hash",
    "last_sync_time",
}

EXPECTED_VAULT_LEDGER_COLUMNS = {
    "id",
    "created_at",
    "balance",
    "allocated_from",
    "trade_id",
    "audit_hash",
    "equity_amount",
    "vault_amount",
    "allocation_profile",
    "blockchain_status",
    "tx_hash",
    "confirmation_count",
}

EXPECTED_VAULT_TRANSFER_COLUMNS = {
    "id",
    "created_at",
    "transfer_id",
    "allocation_trade_id",
    "amount",
    "blockchain_network",
    "wallet_address",
    "tx_hash",
    "blockchain_status",
    "confirmation_count",
    "audit_hash",
    "updated_at",
}


def extract_identifiers(text, identifier):
    return sorted(set(re.findall(
        rf"\b{re.escape(identifier)}\b",
        text,
        re.IGNORECASE,
    )))


def main():
    print("=" * 80)
    print("VOLSIM-PRO IMMUTABLE VAULT CONTRACT AUDIT")
    print("=" * 80)
    print(f"Repository: {ROOT}")
    print()

    if not VAULT_SERVICE.exists():
        print("ERROR: vault_service.py not found:")
        print(VAULT_SERVICE)
        return

    if not ALLOCATION_POLICY.exists():
        print("ERROR: allocation_policy.py not found:")
        print(ALLOCATION_POLICY)
        return

    vault_text = VAULT_SERVICE.read_text(
        encoding="utf-8",
        errors="ignore",
    )

    policy_text = ALLOCATION_POLICY.read_text(
        encoding="utf-8",
        errors="ignore",
    )

    # ------------------------------------------------------------------
    # Canonical allocation policy
    # ------------------------------------------------------------------

    print("1. CANONICAL ALLOCATION POLICY")
    print("-" * 80)

    profile_match = re.search(
        r'allocation_profile\s*:\s*str\s*=\s*"([^"]+)"',
        policy_text,
    )

    equity_match = re.search(
        r'TRADING_EQUITY_PERCENTAGE\s*=\s*ALLOCATION_POLICY\.equity_percentage',
        policy_text,
    )

    vault_match = re.search(
        r'VAULT_PERCENTAGE\s*=\s*ALLOCATION_POLICY\.vault_percentage',
        policy_text,
    )

    percentage_matches = re.findall(
        r'(?:equity_percentage|vault_percentage)\s*:\s*float\s*=\s*([0-9.]+)',
        policy_text,
    )

    print(
        "Profile:",
        profile_match.group(1)
        if profile_match
        else "NOT FOUND",
    )

    print(
        "Percentage declarations:",
        percentage_matches
        if percentage_matches
        else "NOT FOUND",
    )

    print(
        "TRADING_EQUITY_PERCENTAGE alias:",
        "FOUND" if equity_match else "NOT FOUND",
    )

    print(
        "VAULT_PERCENTAGE alias:",
        "FOUND" if vault_match else "NOT FOUND",
    )

    print()

    # ------------------------------------------------------------------
    # Critical database column references
    # ------------------------------------------------------------------

    print("2. IMMUTABLE_VAULT_STATE REFERENCES")
    print("-" * 80)

    important_columns = [
        "last_realized_profit",
        "allocation_profile",
        "equity_percentage",
        "vault_percentage",
        "pending_vault_allocation",
        "total_allocated",
        "total_transferred",
        "last_tx_hash",
        "last_sync_time",
    ]

    for column in important_columns:
        count = len(
            re.findall(
                rf"\b{re.escape(column)}\b",
                vault_text,
                re.IGNORECASE,
            )
        )

        print(f"{column:<30} references={count}")

    print()

    # ------------------------------------------------------------------
    # Schema comparison based on Supabase introspection supplied by user
    # ------------------------------------------------------------------

    print("3. DATABASE CONTRACT COMPARISON")
    print("-" * 80)

    actual_immutable_columns = {
        "id",
        "trading_equity_balance",
        "vault_balance",
        "state_hash",
        "last_updated",
        "allocation_profile",
        "equity_percentage",
        "vault_percentage",
        "pending_vault_allocation",
        "total_allocated",
        "total_transferred",
        "sync_status",
        "wallet_address",
        "blockchain_network",
        "last_tx_hash",
        "last_sync_time",
    }

    missing_from_db = (
        EXPECTED_IMMUTABLE_VAULT_COLUMNS
        - actual_immutable_columns
    )

    unexpected_in_db = (
        actual_immutable_columns
        - EXPECTED_IMMUTABLE_VAULT_COLUMNS
    )

    print(
        "Missing expected schema columns:",
        sorted(missing_from_db)
        if missing_from_db
        else "NONE",
    )

    print(
        "Unexpected schema columns:",
        sorted(unexpected_in_db)
        if unexpected_in_db
        else "NONE",
    )

    print()

    # ------------------------------------------------------------------
    # Explicit critical mismatch
    # ------------------------------------------------------------------

    print("4. CRITICAL CHECK: last_realized_profit")
    print("-" * 80)

    references_last_realized_profit = (
        "last_realized_profit" in vault_text
    )

    exists_in_supplied_schema = (
        "last_realized_profit" in actual_immutable_columns
    )

    print(
        "VaultService references column:",
        references_last_realized_profit,
    )

    print(
        "Column exists in supplied DB schema:",
        exists_in_supplied_schema,
    )

    if (
        references_last_realized_profit
        and not exists_in_supplied_schema
    ):
        print()
        print(
            "!!! CONTRACT MISMATCH DETECTED !!!"
        )
        print(
            "vault_service.py persists last_realized_profit,"
        )
        print(
            "but immutable_vault_state does not contain that column."
        )
        print(
            "DO NOT deploy or declare vault persistence complete"
        )
        print(
            "until this mismatch is resolved."
        )
    else:
        print("No mismatch detected.")

    print()

    # ------------------------------------------------------------------
    # Legacy allocation path
    # ------------------------------------------------------------------

    print("5. LEGACY ALLOCATION PROFILE CHECK")
    print("-" * 80)

    legacy_files = [
        ROOT / "vault_manager.LEGACY.py",
        ROOT / "cpp_core" / "vault_manager.LEGACY.py",
    ]

    found_legacy = False

    for path in legacy_files:
        if path.exists():
            found_legacy = True
            print("Quarantined legacy file:")
            print(" ", path.relative_to(ROOT))

            text = path.read_text(
                encoding="utf-8",
                errors="ignore",
            )

            if "allocation_profiles" in text:
                print(
                    "   allocation_profiles reference: YES"
                )

            if "50.0" in text:
                print(
                    "   legacy 50/50 fallback: YES"
                )

    if not found_legacy:
        print(
            "No quarantined legacy allocation managers found."
        )

    print()

    # ------------------------------------------------------------------
    # Active source check
    # ------------------------------------------------------------------

    print("6. ACTIVE SOURCE-OF-TRUTH CHECK")
    print("-" * 80)

    active_roots = [
        ROOT / "src",
    ]

    active_matches = []

    for root in active_roots:
        if not root.exists():
            continue

        for path in root.rglob("*.py"):
            if "__pycache__" in path.parts:
                continue

            try:
                text = path.read_text(
                    encoding="utf-8",
                    errors="ignore",
                )
            except Exception:
                continue

            if "allocation_profiles" in text:
                active_matches.append(
                    path.relative_to(ROOT)
                )

    if active_matches:
        print(
            "ACTIVE Python files still referencing allocation_profiles:"
        )

        for path in sorted(active_matches):
            print(" ", path)
    else:
        print(
            "PASS: No active src/*.py references allocation_profiles."
        )

    print()

    print("=" * 80)
    print("AUDIT COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    main()
