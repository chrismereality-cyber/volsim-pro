import psycopg2
import hashlib

DB_URI = "postgresql://postgres.eqvxnfzuinrbwidztrtm:Greedy2026Volsim@aws-1-eu-north-1.pooler.supabase.com:6543/postgres"

def get_latest_vault_balance():
    """Fetches the current accumulated balance from the vault ledger."""
    try:
        conn = psycopg2.connect(DB_URI)
        cursor = conn.cursor()
        
        cursor.execute("SELECT balance FROM public.vault_ledger ORDER BY id DESC LIMIT 1;")
        row = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return float(row[0]) if row else 0.00
    except Exception as e:
        print(f"⚠️ Error reading vault balance: {str(e)}")
        return 0.00

def process_live_trade_allocation(trade_id, profit, current_balance):
    """
    Evaluates a closed trade. If profit > 0, calculates the split based on the progressive matrix
    and writes it securely to the Supabase ledger database.
    """
    profit = float(profit)
    if profit <= 0:
        return get_latest_vault_balance()

    try:
        conn = psycopg2.connect(DB_URI)
        cursor = conn.cursor()
        
        # 1. Idempotency Check: Verify if this trade ticket was already processed
        cursor.execute("SELECT id FROM public.vault_ledger WHERE trade_id = %s;", (str(trade_id),))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return get_latest_vault_balance() # Already logged, skip processing

        # 2. Get current state metrics
        last_vault_balance = get_latest_vault_balance()
        total_combined_capital = float(current_balance) + last_vault_balance
        trading_equity_percent = (float(current_balance) / total_combined_capital * 100) if total_combined_capital > 0 else 100

        # 3. Dynamic Spec-Tier Ratio Allocation Logic
        vault_share_percent = 50
        if trading_equity_percent <= 10: vault_share_percent = 90
        elif trading_equity_percent <= 20: vault_share_percent = 80
        elif trading_equity_percent <= 30: vault_share_percent = 70
        elif trading_equity_percent <= 40: vault_share_percent = 60

        # 4. Calculate the split allocation
        allocated_amount = profit * (vault_share_percent / 100.0)
        new_vault_balance = last_vault_balance + allocated_amount

        # 5. Build Cryptographic Hash Sequence Verification String
        seed_string = f"{trade_id}-{new_vault_balance}-{allocated_amount}"
        audit_hash = f"0x{hashlib.sha256(seed_string.encode('utf-8')).hexdigest().upper()}"

        # 6. Push safely into the database ledger table
        cursor.execute("""
            INSERT INTO public.vault_ledger (balance, allocated_from, trade_id, audit_hash)
            VALUES (%s, %s, %s, %s);
        """, (new_vault_balance, allocated_amount, str(trade_id), audit_hash))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ [VAULT PROVISIONED]: Trade {trade_id} split. Allocated ${allocated_amount:.2f} to Vault.")
        return new_vault_balance

    except Exception as e:
        print(f"❌ [VAULT ERROR]: Allocation pipeline crash: {str(e)}")
        return get_latest_vault_balance()