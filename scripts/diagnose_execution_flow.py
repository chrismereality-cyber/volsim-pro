from pathlib import Path

target = Path(r"C:\volsim-dev\src\services\execution_service.py")
source = target.read_text(encoding="utf-8")

print("=" * 60)
print("VOLSIM-PRO EXECUTION FLOW DIAGNOSTIC")
print("=" * 60)

markers = [
    'if self.execution_mode == "PAPER":',
    "execution_guard_service.evaluate(",
    "risk_engine_service.approve_order(",
    "mt5.order_check(",
    "mt5.order_send(",
]

for marker in markers:
    index = source.find(marker)

    print("")
    print(marker)
    print("INDEX:", index)

    if index >= 0:
        line = source[:index].count("\n") + 1
        print("LINE :", line)

print("")
print("=" * 60)
print("PAPER / GUARD ORDER")
print("=" * 60)

paper = source.find('if self.execution_mode == "PAPER":')
guard = source.find("execution_guard_service.evaluate(")

if paper >= 0 and guard >= 0:

    if guard < paper:
        print("GUARD BEFORE PAPER: YES")
    else:
        print("GUARD BEFORE PAPER: NO")

print("")
print("READ-ONLY DIAGNOSTIC.")
print("NO MT5 ORDER SENT.")
print("NO POSITION OPENED.")
print("NO POSITION CLOSED.")
print("NO BLOCKCHAIN TRANSFER SENT.")
