import MetaTrader5 as mt5
import sys

print("--- MT5 DIAGNOSTIC START ---")
if not mt5.initialize():
    print(f"FAILED: {mt5.last_error()}")
    
    # Common Error Codes:
    # -4: Terminal not found (Usually path issue)
    # -5: Permission denied (Run as Admin)
    # -2: Connection failed (Login details)
    
    print("\nAttempting with explicit path...")
    # Update the path below if your MT5 is elsewhere
    path = r"C:\Program Files\MetaTrader 5\terminal64.exe"
    if mt5.initialize(path=path):
        print("SUCCESS with explicit path!")
    else:
        print(f"STILL FAILED: {mt5.last_error()}")
else:
    print("SUCCESS: MT5 is linked!")

mt5.shutdown()