from pathlib import Path

ROOT = Path(r"C:\volsim-dev")

files = [
    ROOT / ".env",
    ROOT / ".env.local",
]

print("=" * 60)
print("VOLSIM-PRO ENVIRONMENT ENCODING NORMALIZATION")
print("=" * 60)

for path in files:

    print("")
    print("FILE:")
    print(path)

    if not path.exists():
        print("NOT FOUND")
        continue

    raw = path.read_bytes()

    print("Original byte length:", len(raw))

    if raw.startswith(b"\xff\xfe") or raw.startswith(b"\xfe\xff"):
        print("Detected: UTF-16")

        text = raw.decode("utf-16")

    elif raw.startswith(b"\xef\xbb\xbf"):
        print("Detected: UTF-8 BOM")

        text = raw.decode("utf-8-sig")

    else:
        try:
            text = raw.decode("utf-8")
            print("Detected: UTF-8")
        except UnicodeDecodeError:
            print("UTF-8 decode failed; attempting UTF-16...")
            text = raw.decode("utf-16")

    # Remove accidental BOM characters and normalize line endings.
    text = text.replace("\ufeff", "")
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Write clean UTF-8 without BOM.
    path.write_text(
        text,
        encoding="utf-8",
        newline="\n",
    )

    print("Normalized to: UTF-8")
    print("New byte length:", path.stat().st_size)

print("")
print("=" * 60)
print("ENCODING NORMALIZATION COMPLETE")
print("=" * 60)
print("")
print("Environment values were preserved.")
print("No credentials were printed.")
print("No API requests sent.")
print("No MT5 order sent.")
