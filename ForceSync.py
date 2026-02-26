import requests

# The URL you confirmed is Online
url = "https://volsim-pro.onrender.com/api/trade/status"

# Your current MT5 numbers
data = {
    "account": {
        "balance": "4900.84", 
        "equity": "4900.84", 
        "price": "2030.50" # Update this to current market price if needed
    }
}

try:
    response = requests.post(url, json=data, timeout=10)
    print(f"🚀 Render Sync Status: {response.status_code}")
    if response.status_code == 200:
        print("✅ Cloud updated with $4,900.84 balance!")
    else:
        print(f"❌ Server error: {response.text}")
except Exception as e:
    print(f"❌ Connection Failed: {e}")
