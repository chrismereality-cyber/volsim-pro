import os
import requests
import datetime

# --- Configuration ---
SUPABASE_URL = "https://eqvxnfzuinrbwidztrtm.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def get_active_allocation():
    """Phase 1: Fetch active allocation profile from DB."""
    url = f"{SUPABASE_URL}/rest/v1/allocation_profiles?is_active=eq.true"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept-Profile": "public"
    }
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200 and response.json():
            return response.json()[0]
    except Exception as e:
        print(f"❌ Error fetching allocation: {e}")

    # Fallback to 50/50 if DB call fails
    return {"trading_equity_pct": 50.0, "vault_pct": 50.0}

def process_profit_allocation(realized_profit):
    """Phase 2: Calculate split and queue for blockchain."""
    profile = get_active_allocation()
    equity_pct = float(profile['trading_equity_pct']) / 100
    vault_pct = float(profile['vault_pct']) / 100

    allocation = {
        "equity_amount": realized_profit * equity_pct,
        "vault_amount": realized_profit * vault_pct,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

    print(f"✅ Allocation Calculated: {allocation}")

    # Insert into ledger as PENDING (for web3.py to pick up)
    insert_ledger_entry(allocation)
    return allocation

def insert_ledger_entry(data):
    url = f"{SUPABASE_URL}/rest/v1/vault_ledger"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    payload = {
        "equity_allocation": data['equity_amount'],
        "vault_allocation": data['vault_amount'],
        "sync_status": "PENDING",
        "blockchain_status": "QUEUED"
    }
    requests.post(url, headers=headers, json=payload)

if __name__ == "__main__":
    # Test: Simulate a profit of 1000.0 being closed
    process_profit_allocation(1000.0)
