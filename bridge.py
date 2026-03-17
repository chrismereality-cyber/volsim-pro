import os
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Global variable to store the latest trade data
latest_data = {
    "status": "connected",
    "symbol": "BTCUSDm",
    "balance": 0.0,
    "equity": 0.0,
    "profit": 0.0,
    "mode": "cloud"
}

@app.route('/api/trade/status', methods=['GET'])
def get_status():
    return jsonify(latest_data)

@app.route('/update', methods=['POST'])
def update_data():
    global latest_data
    data = request.json
    if data:
        latest_data.update(data)
        return jsonify({"message": "Data updated"}), 200
    return jsonify({"error": "No data"}), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
