import os
import requests
import datetime

# --- Configuration ---
SUPABASE_URL = "https://eqvxnfzuinrbwidztrtm.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
DAILY_LOSS_LIMIT = 500.0

def get_today_realized_loss():
    """Calculates cumulative losses for today from the order_audit table."""
    today = datetime.datetime.utcnow().strftime('%Y-%m-%d')
    # Filter for today's logs and only rows where PnL is negative (a loss)
    # We use 'pnl=lt.0' to only sum losses
    url = f"{SUPABASE_URL}/rest/v1/order_audit?created_at=gte.{today}&pnl=lt.0"
    headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Accept-Profile": "public"}

    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            # Sum up the 'pnl' field from the returned list of dictionaries
            total_loss = sum(float(row.get('pnl', 0)) for row in data)
            return abs(total_loss) # Returning positive value for comparison
        return 0.0
    except Exception as e:
        print(f"❌ Error calculating persistence: {e}")
        return 0.0

def safe_execute_trade(mt5_bridge, *args, **kwargs):
    """Production Gatekeeper: Checks DB-backed PnL before execution."""
    current_loss = get_today_realized_loss()

    if current_loss >= DAILY_LOSS_LIMIT:
        print(f"🛑 Trading Halted: Persistent daily loss ({current_loss}) reached.")
        return False

    return mt5_bridge.send_order(*args, **kwargs)
