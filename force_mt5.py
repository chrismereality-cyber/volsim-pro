import MetaTrader5 as mt5
import time

print("--- FORCING TITAN CONNECTION ---")
# Using forward slashes / avoids the backslash error in Python
path = "C:/Program Files/MetaTrader 5/terminal64.exe"

# Shutdown any existing dead links
mt5.shutdown()
time.sleep(2)

# Attempt initialization with a longer timeout
if not mt5.initialize(path=path, timeout=60000):
    print(f"❌ Still Timing Out. Error: {mt5.last_error()}")
else:
    print("🚀 SUCCESS! TITAN IS ONLINE.")
    print(f"Terminal Info: {mt5.terminal_info()._asdict() if mt5.terminal_info() else 'No Info'}")