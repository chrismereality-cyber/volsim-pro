import os
import requests
import time
from dotenv import load_dotenv
from web3 import Web3
from error_handling import with_retry, verify_transaction

load_dotenv()

# --- Config ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
RPC_URL = os.getenv("RPC_URL")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
VAULT_ADDRESS = os.getenv("VAULT_ADDRESS")

web3 = Web3(Web3.HTTPProvider(RPC_URL))
account = web3.eth.account.from_key(PRIVATE_KEY)

def execute_blockchain_transfer(amount_eth):
    """EIP-1559 Production Transfer Logic"""
    nonce = web3.eth.get_transaction_count(account.address)
    
    # Get dynamic fee data
    fee_history = web3.eth.fee_history(1, 'latest', [20])
    base_fee = fee_history['baseFeePerGas'][-1]
    priority_fee = web3.to_wei(2, 'gwei') # Standard priority
    max_fee = base_fee + priority_fee

    tx = {
        'nonce': nonce,
        'to': VAULT_ADDRESS,
        'value': web3.to_wei(amount_eth, 'ether'),
        'gas': 21000,
        'maxFeePerGas': max_fee,
        'maxPriorityFeePerGas': priority_fee,
        'chainId': 1 
    }
    
    signed_tx = web3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = web3.eth.send_raw_transaction(signed_tx.rawTransaction)
    return web3.to_hex(tx_hash)

# [Remaining sync_worker and update_ledger logic...]
