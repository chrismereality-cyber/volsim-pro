import MetaTrader5 as mt5

if not mt5.initialize():
    print(f"❌ Init Failed: {mt5.last_error()}")
else:
    account_info = mt5.account_info()
    if account_info:
        print("--- ACTUAL CONNECTION DATA ---")
        print(f"Login: {account_info.login}")
        print(f"Server: {account_info.server}")
        print(f"Company: {account_info.company}")
    else:
        print("❌ Not logged in manually. Please log in to MT5 first.")
    mt5.shutdown()