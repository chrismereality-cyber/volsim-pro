import requests
import json

SUPABASE_URL = "https://eqvxnfzuinrbwidztrtm.supabase.co"
SUPABASE_KEY = "sb_secret_yQXsne0YM8MRZYv9C4lUkg_OSofvWv2"

def run_migrations():
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    # SQL to create the table
    sql = """
    CREATE TABLE IF NOT EXISTS order_audit (
        id SERIAL PRIMARY KEY,
        action TEXT,
        magic_number BIGINT,
        reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
    );
    """
    
    # Execute via RPC or direct SQL
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/exec_sql", 
        headers=headers, 
        json={"query": sql}
    )
    
    if response.status_code in [200, 201, 204]:
        print("✅ SUCCESS: 'order_audit' table ensured via REST API.")
    else:
        print(f"❌ ERROR {response.status_code}: {response.text}")

if __name__ == '__main__':
    run_migrations()
