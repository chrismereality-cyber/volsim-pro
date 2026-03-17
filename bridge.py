from flask import Flask, jsonify, request
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Fallback data if nothing has been pushed yet
latest_stats = {
    "balance": 0.0,
    "equity": 0.0,
    "profit": 0.0,
    "symbol": "WAITING_FOR_MT5",
    "status": "BRIDGE_ONLINE"
}

@app.route('/')
def health():
    return "Volsim Bridge: Operational"

@app.route('/api/trade/status', methods=['GET'])
def get_status():
    return jsonify(latest_stats)

@app.route('/update', methods=['POST'])
def update_data():
    global latest_stats
    try:
        data = request.get_json(force=True)
        if data:
            # Update our global memory
            latest_stats.update(data)
            print(f"DEBUG: Received update - Profit: {data.get('profit')}")
            return jsonify({"status": "success", "synced": latest_stats}), 200
    except Exception as e:
        print(f"DEBUG: Error in update - {str(e)}")
    return jsonify({"status": "error"}), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
