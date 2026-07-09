import sys
import psycopg2

# Try 1: Cleaned URI (assuming brackets were just wrapper symbols)
DB_URI_CLEAN = "postgresql://postgres.eqvxnfzuinrbwidztrtm:Greedy2026Volsim@aws-1-eu-north-1.pooler.supabase.com:6543/postgres"

# Try 2: Escaped URI (if brackets [ and ] are literally part of your secret key)
DB_URI_ESCAPED = "postgresql://postgres.eqvxnfzuinrbwidztrtm:%5BGreedy2026Volsim%5D@aws-1-eu-north-1.pooler.supabase.com:6543/postgres"

print("📡 Connecting directly to Supabase via PostgreSQL Connection Pooler...")

def attempt_migration(uri, mode_label):
    try:
        conn = psycopg2.connect(uri)
        cursor = conn.cursor()
        
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS public.vault_ledger (
            id BIGSERIAL PRIMARY KEY,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            balance NUMERIC(12, 4) DEFAULT 0.00,
            allocated_from NUMERIC(12, 4) DEFAULT 0.00,
            trade_id TEXT UNIQUE NULL,
            audit_hash TEXT NOT NULL
        );
        """
        cursor.execute(create_table_sql)
        conn.commit()
        cursor.close()
        conn.close()
        print(f"✅ SUCCESS: 'vault_ledger' table provisioned using {mode_label} authentication format!")
        return True
    except Exception as e:
        if "password authentication failed" in str(e):
            print(f"⚠️ {mode_label} format failed: Password rejected.")
        else:
            print(f"❌ Connection error under {mode_label}: {str(e)}")
        return False

# Execution step sequence
if not attempt_migration(DB_URI_CLEAN, "Standard Plain"):
    print("🔄 Attempting fallback link utilizing URL-encoded special characters...")
    if not attempt_migration(DB_URI_ESCAPED, "Hex URL-Encoded"):
        print("\n❌ CRITICAL: Both format attempts were rejected by the broker pooler.")
        print("Please double-check your database password in your Supabase dashboard settings.")
        sys.exit(1)