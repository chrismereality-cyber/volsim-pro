from pathlib import Path
import shutil

source = Path("src/services/global_state_service.py")
legacy_dir = Path("legacy")
destination = legacy_dir / "global_state_service.py"

print("\n=== RETIRE LEGACY GLOBAL STATE SERVICE ===\n")

if not source.exists():
    print("Legacy service already retired.")
    raise SystemExit(0)

legacy_dir.mkdir(exist_ok=True)

if destination.exists():
    destination.unlink()

shutil.move(str(source), str(destination))

print(f"RETIRED: {source}")
print(f"ARCHIVED: {destination}")

print("\n=== VERIFY ACTIVE SERVICE PATH ===\n")

if source.exists():
    print("ERROR: legacy service still exists in src/services")
else:
    print("PASS: src/services/global_state_service.py removed")

print("\n=== COMPLETE ===\n")
