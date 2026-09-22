from pathlib import Path

path = Path("src/api/main.py")

if not path.exists():
    raise SystemExit("ERROR: src/api/main.py not found")

text = path.read_text(encoding="utf-8")

old = "from src.services.global_state_service import global_state_orchestrator"

if old in text:
    text = text.replace(old + "\n", "")
    text = text.replace(old, "")
    path.write_text(text, encoding="utf-8")
    print("REMOVED legacy global_state_orchestrator import from src/api/main.py")
else:
    print("Legacy global_state_orchestrator import already absent")

print("\n=== MAIN.PY GLOBAL STATE REFERENCES ===\n")

for lineno, line in enumerate(
    path.read_text(encoding="utf-8").splitlines(),
    1
):
    if "global_state" in line.lower():
        print(f"{lineno}: {line}")

print("\n=== COMPLETE ===")
