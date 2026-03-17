import os
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Fail-safe for MetaTrader5
try:
    import MetaTrader5 as mt5
    MT5_AVAILABLE = True
except ImportError:
    MT5_AVAILABLE = False
    print("MT5 not detected (Running in Cloud Mode)")

@app.route('/api/trade/status')
def get_status():
    # In Cloud mode, this would usually pull from a database
    # For now, we return a success signal
    return jsonify({
        "status": "connected",
        "mode": "cloud" if not MT5_AVAILABLE else "local",
        "info": "Render API is Live"
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
