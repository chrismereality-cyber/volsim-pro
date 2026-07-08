import MetaTrader5 as mt5

print("Connecting to local MT5 Terminal...")
if not mt5.initialize():
    print(f"Failed to connect to MetaTrader5 terminal. Error code: {mt5.last_error()}")
    quit()

account_info = mt5.account_info()
if account_info is None:
    print("Failed to retrieve account details. Is an account logged in?")
else:
    print("\n=== MT5 CORE CONNECTIVITY MATRIX CONFIRMED ===")
    print(f"Account Login: {account_info.login}")
    print(f"Company/Broker: {account_info.company}")
    print(f"Actual Balance: ${account_info.balance:,.2f}")
    print(f"Actual Equity:  ${account_info.equity:,.2f}")
    print(f"Floating P/L:   ${account_info.profit:,.2f}")
    print("==============================================")

mt5.shutdown()