import time
from web3.exceptions import TransactionNotFound

def with_retry(func, retries=3, delay=10):
    """
    Wraps blockchain calls with exponential backoff.
    """
    for i in range(retries):
        try:
            return func()
        except Exception as e:
            print(f"⚠️ Attempt {i+1} failed: {e}. Retrying in {delay}s...")
            time.sleep(delay)
            delay *= 2 # Exponential backoff
    raise Exception("Max retries exceeded for blockchain operation.")

def verify_transaction(tx_hash, web3, timeout=300):
    """
    Polls the blockchain to ensure the transaction was actually mined.
    """
    print(f"🔍 Verifying {tx_hash}...")
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            receipt = web3.eth.get_transaction_receipt(tx_hash)
            if receipt and receipt.status == 1:
                print("✅ Transaction Confirmed on-chain.")
                return True
            elif receipt and receipt.status == 0:
                print("❌ Transaction Reverted on-chain.")
                return False
        except TransactionNotFound:
            pass
        time.sleep(15)
    print("⏳ Transaction verification timed out.")
    return False
