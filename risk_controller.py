import requests
import datetime

SUPABASE_URL = "https://eqvxnfzuinrbwidztrtm.supabase.co"
SUPABASE_KEY = "sb_secret_yQXsne0YM8MRZYv9C4lUkg_OSofvWv2"

def log_to_supabase(action, magic, reason):
    # Use the base table name only
    url = f"{SUPABASE_URL}/rest/v1/order_audit"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Accept-Profile": "public",
        "Prefer": "return=minimal"
    }
    data = {
        "action": action, 
        "magic_number": magic, 
        "reason": reason, 
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    try:
        response = requests.post(url, headers=headers, json=data)
        print(f"DEBUG: Status {response.status_code} | Response: {response.text}")
    except Exception as e:
        print(f"DEBUG: Request failed: {e}")

if __name__ == "__main__":
    print("🚀 Testing with clean URL and Accept-Profile...")
    log_to_supabase("TEST_EXIT", 9999, "SIMULATED_PROFIT_MET")
