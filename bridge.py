from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# This allows your Vercel frontend to talk to your local computer
CORS(app)

# Global variable to store the current signal
current_signal = {"action": None}

@app.route('/')
def home():
    return "Titan Bridge is Online (Local Mode)"

@app.route('/set-signal', methods=['GET'])
def set_signal():
    action = request.args.get('action')
    if action in ['BUY', 'SELL', 'CLOSE']:
        current_signal['action'] = action
        print(f"?? SIGNAL SET: {action}")
        return jsonify({"status": "success", "signal": action}), 200
    return jsonify({"status": "error", "message": "Invalid action"}), 400

@app.route('/get-signal', methods=['GET'])
def get_signal():
    # Retrieve the signal and then clear it
    action = current_signal['action']
    if action:
        current_signal['action'] = None  # Clear signal after delivery
        print(f"?? SIGNAL SENT TO MT5: {action}")
        return action, 200
    return "WAIT", 200

if __name__ == '__main__':
    print("? BRIDGE UPDATED WITH CORS SUPPORT")
    print("?? Listening on http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000, debug=False)
