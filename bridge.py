from flask import Flask, jsonify, request
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Storage for your BTCUSDm data
latest_data = {
    "balance": 20.72,
    "equity": 18.42,
    "profit": -2.30,
    "symbol": "BTCUSDm",
    "status": "connected"
}

@app.route('/')
def home():
    return "Volsim Bridge API is Online"

@app.route('/api/trade/status', methods=['GET'])
def get_status():
    return jsonify(latest_data)

@app.route('/update', methods=['POST'])
def update_data():
    global latest_data
    # We use force=True to ignore content-type mismatches
    data = request.get_json(force=True)
    if data:
        latest_data.update(data)
        return jsonify({"status": "success", "received": data}), 200
    return jsonify({"status": "error", "message": "No data"}), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
