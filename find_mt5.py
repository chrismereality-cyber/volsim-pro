import os
import MetaTrader5 as mt5

print("--- LOCATING MT5 TERMINAL ---")
# Common spots where MT5 installs itself
search_paths = [
    r"C:\Program Files\MetaTrader 5\terminal64.exe",
    r"C:\Program Files (x86)\MetaTrader 5\terminal64.exe",
    os.path.join(os.path.expanduser("~"), "AppData", "Roaming", "MetaTrader 5", "terminal64.exe")
]

found_path = None
for path in search_paths:
    if os.path.exists(path):
        print(f"✅ FOUND: {path}")
        found_path = path
        break

if found_path:
    print("\n--- ATTEMPTING CONNECTION ---")
    if mt5.initialize(path=found_path):
        print("🚀 SUCCESS! MT5 is now linked to Python.")
        mt5.shutdown()
    else:
        print(f"❌ STILL FAILED: {mt5.last_error()}")
else:
    print("❌ COULD NOT FIND MT5. Please right-click the MT5 icon on your taskbar, right-click 'MetaTrader 5' again, select 'Properties', and copy the 'Target' path here.")