import os
import requests
from dotenv import load_dotenv
from web3 import Web3

load_dotenv()

# --- Config ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
RPC_URL = os.getenv("RPC_URL")
web3 = Web3(Web3.HTTPProvider(RPC_URL))

def get_synced_entries():
    url = f"{SUPABASE_URL}/rest/v1/vault_ledger?sync_status=eq.SYNCED"
    headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    response = requests.get(url, headers=headers)
    return response.json() if response.status_code == 200 else []

def reconcile():
    print("⚖️ Starting Vault Reconciliation Audit...")
    entries = get_synced_entries()
    
    for entry in entries:
        tx_hash = entry.get('last_tx_hash')
        if not tx_hash:
            print(f"⚠️ Alert: Entry {entry['id']} marked SYNCED but has no TX hash!")
            continue
            
        # Check on-chain
        try:
            receipt = web3.eth.get_transaction_receipt(tx_hash)
            if receipt and receipt.status == 1:
                # Valid
                continue
            else:
                print(f"❌ Discrepancy Found: TX {tx_hash} failed or reverted on-chain.")
        except Exception as e:
            print(f"⚠️ Error checking TX {tx_hash}: {e}")

    print("✅ Audit Complete.")

if __name__ == "__main__":
    reconcile()
