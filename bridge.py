from flask import Flask, jsonify, request
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Storage with strict formatting
latest_stats = {
    "balance": 0.00,
    "equity": 0.00,
    "profit": 0.00,
    "symbol": "MT5_OFFLINE",
    "status": "BRIDGE_LIVE"
}

@app.route('/api/trade/status', methods=['GET'])
def get_status():
    return jsonify(latest_stats)

@app.route('/update', methods=['POST'])
def update_data():
    global latest_stats
    try:
        data = request.get_json(force=True)
        if data:
            # Force conversion to floats/strings to ensure React likes it
            latest_stats["balance"] = float(data.get("balance", 0))
            latest_stats["equity"] = float(data.get("equity", 0))
            latest_stats["profit"] = float(data.get("profit", 0))
            latest_stats["symbol"] = str(data.get("symbol", "BTCUSDm"))
            latest_stats["status"] = "LIVE"
            return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400
    return jsonify({"status": "no_data"}), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
