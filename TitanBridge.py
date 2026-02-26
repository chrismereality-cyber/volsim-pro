import socket, threading, requests, time
from flask import Flask, request, jsonify

app = Flask(__name__)
RENDER_URL = "https://volsim-pro.onrender.com/api/trade/status"

@app.route('/')
def home(): return "Bridge Online", 200

def socket_server():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('0.0.0.0', 9090))
    s.listen(5)
    print("📡 Bridge Active: Waiting for MT5 (Target: $3,000.77)...")
    while True:
        conn, addr = s.accept()
        print("✅ MT5 Connected")
        while True:
            try:
                data = conn.recv(1024).decode().strip()
                if not data: break
                parts = data.split('|')
                if len(parts) >= 2:
                    payload = {"account": {"balance": parts[0], "equity": parts[1], "price": parts[2] if len(parts)>2 else "0"}}
                    requests.post(RENDER_URL, json=payload, timeout=5)
                    print(f"💰 SYNCED: ${parts[0]}")
            except: break

threading.Thread(target=socket_server, daemon=True).start()
app.run(host='0.0.0.0', port=5000)
