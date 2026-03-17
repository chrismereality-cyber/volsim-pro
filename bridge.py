from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import json

app = Flask(__name__)
CORS(app)

# File-based storage to survive Render's multi-process resets
DATA_FILE = "trade_cache.json"

def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f)

def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    return {"balance": 0, "equity": 0, "profit": 0, "symbol": "Waiting...", "status": "BOOTING"}

@app.route('/')
def home():
    return "Bridge Persistent Mode: Active"

@app.route('/api/trade/status', methods=['GET'])
def get_status():
    return jsonify(load_data())

@app.route('/update', methods=['POST'])
def update_data():
    data = request.get_json(force=True)
    if data:
        save_data(data)
        return jsonify({"status": "success"}), 200
    return jsonify({"status": "error"}), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
