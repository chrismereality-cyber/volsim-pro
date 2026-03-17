from flask import Flask, jsonify, request
from flask_cors import CORS
import os

app = Flask(__name__)
# THIS LINE ALLOWS VERCEL TO SEE THE FIGURES
CORS(app, resources={r"/*": {"origins": "*"}})

latest_stats = {
    "balance": 0.0,
    "equity": 0.0,
    "profit": 0.0,
    "symbol": "BTCUSDm",
    "status": "READY"
}

@app.route('/')
def home():
    return "BRIDGE_ONLINE"

@app.route('/api/trade/status', methods=['GET'])
def get_status():
    return jsonify(latest_stats)

@app.route('/update', methods=['POST'])
def update_data():
    global latest_stats
    data = request.get_json(force=True)
    if data:
        latest_stats.update(data)
        return jsonify({"status": "success"}), 200
    return jsonify({"status": "error"}), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
