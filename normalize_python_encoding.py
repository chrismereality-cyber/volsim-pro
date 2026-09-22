from pathlib import Path

FILES = [
    Path("src/services/global_trading_state_service.py"),
    Path("src/services/risk_service.py"),
    Path("src/services/global_state_service.py"),
]

print("\n=== UTF-8 BOM NORMALIZATION ===\n")

for path in FILES:

    if not path.exists():
        print(f"NOT FOUND: {path}")
        continue

    raw = path.read_bytes()

    if raw.startswith(b"\xef\xbb\xbf"):
        path.write_text(
            raw[3:].decode("utf-8"),
            encoding="utf-8"
        )
        print(f"FIXED BOM: {path}")
    else:
        print(f"CLEAN:     {path}")

print("\n=== COMPLETE ===\n")
