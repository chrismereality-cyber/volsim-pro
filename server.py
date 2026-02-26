import MetaTrader5 as mt5
from flask import Flask, request, jsonify
from flask_cors import CORS

# Use the EXACT name from the discover.py script
LOGIN = 298556693
PASS = "TitanTest2026#"
SERVER = "Exness-MT5Trial9" # Update this if discover.py says different

app = Flask(__name__)
CORS(app)

def connect():
    # Calling initialize without a path often works better 
    # if the terminal is already running as Admin.
    if not mt5.initialize():
        print("❌ Local Init Failed")
        return False
    if not mt5.login(LOGIN, password=PASS, server=SERVER):
        print(f"❌ Auth Failed: {mt5.last_error()}")
        return False
    return True

@app.route('/health')
def health():
    return jsonify({"status": "Titan Bridge Active", "balance": mt5.account_info().balance})

if __name__ == "__main__":
    if connect():
        print("🚀 TITAN IS LIVE. BRIDGE ESTABLISHED.")
        app.run(port=5000)