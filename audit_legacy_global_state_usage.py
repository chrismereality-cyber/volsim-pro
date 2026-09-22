from pathlib import Path

legacy = Path("src/services/global_state_service.py")

print("\n=== LEGACY GLOBAL STATE USAGE AUDIT ===\n")

if not legacy.exists():
    print("Legacy service already absent.")
    raise SystemExit(0)

print(f"Legacy service exists: {legacy}")

print("\nSearching active src/ imports...\n")

for path in Path("src").rglob("*.py"):

    if "__pycache__" in str(path):
        continue

    if path == legacy:
        continue

    try:
        text = path.read_text(encoding="utf-8")
    except Exception:
        continue

    for lineno, line in enumerate(text.splitlines(), 1):

        if (
            "global_state_service" in line
            or "global_state_orchestrator" in line
        ):
            print(f"{path}:{lineno}: {line.strip()}")

print("\n=== END LEGACY USAGE AUDIT ===\n")
