import os
import requests
from dotenv import load_dotenv
from web3 import Web3

load_dotenv()

# --- Config ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
RPC_URL = os.getenv("RPC_URL")
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
web3 = Web3(Web3.HTTPProvider(RPC_URL))

def send_telegram_alert(message):
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    payload = {"chat_id": TELEGRAM_CHAT_ID, "text": f"🚨 Vault Audit Alert:\n{message}"}
    requests.post(url, json=payload)

def reconcile():
    print("⚖️ Starting Vault Reconciliation Audit...")
    entries = get_synced_entries()
    discrepancy_found = False
    
    for entry in entries:
        tx_hash = entry.get('last_tx_hash')
        try:
            receipt = web3.eth.get_transaction_receipt(tx_hash)
            if not (receipt and receipt.status == 1):
                msg = f"Discrepancy in TX {tx_hash} for Entry {entry['id']}"
                print(f"❌ {msg}")
                send_telegram_alert(msg)
                discrepancy_found = True
        except Exception as e:
            msg = f"Audit Error on TX {tx_hash}: {e}"
            print(f"⚠️ {msg}")
            send_telegram_alert(msg)
            discrepancy_found = True

    if not discrepancy_found:
        print("✅ Audit Complete: No discrepancies found.")

# [Keep your get_synced_entries helper function here]
