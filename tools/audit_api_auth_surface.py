from pathlib import Path
import ast

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"

EXCLUDED_DIRS = {
    ".venv",
    "venv",
    "node_modules",
    ".next",
    "__pycache__",
    ".git",
    "dist",
    "build",
}

EXTENSIONS = {
    ".py",
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
}

PATTERNS = (
    "supabase",
    "jwt",
    "token",
    "bearer",
    "oauth",
    "login",
    "signin",
    "signup",
    "user_id",
    "account_id",
    "current_user",
    "authorization",
    "authentication",
)

def should_skip(path: Path) -> bool:
    return any(part in EXCLUDED_DIRS for part in path.parts)


print("=" * 90)
print("VOLSIM-PRO API / AUTHORIZATION SURFACE AUDIT")
print("=" * 90)

for path in sorted(SRC.rglob("*")):

    if not path.is_file():
        continue

    if path.suffix.lower() not in EXTENSIONS:
        continue

    if should_skip(path):
        continue

    if path.name.endswith((".bak", ".disabled", ".backup")):
        continue

    try:
        text = path.read_text(
            encoding="utf-8-sig",
            errors="ignore",
        )
    except Exception:
        continue

    if path.suffix.lower() == ".py":

        try:
            tree = ast.parse(text)
        except Exception as exc:
            print(
                f"\n[PARSE ERROR] "
                f"{path.relative_to(ROOT)}: {exc}"
            )
            continue

        routes = []

        for node in ast.walk(tree):

            if not isinstance(
                node,
                (ast.FunctionDef, ast.AsyncFunctionDef),
            ):
                continue

            for decorator in node.decorator_list:

                try:
                    decorator_text = ast.unparse(decorator)
                except Exception:
                    continue

                if (
                    "router." in decorator_text
                    or "app." in decorator_text
                ):
                    routes.append(
                        (
                            node.name,
                            decorator_text,
                            isinstance(
                                node,
                                ast.AsyncFunctionDef,
                            ),
                        )
                    )

        if routes:

            print(
                f"\nFILE: "
                f"{path.relative_to(ROOT)}"
            )

            for (
                name,
                decorator,
                is_async,
            ) in routes:

                print(
                    f"  ROUTE: {name}"
                    f" | {'async' if is_async else 'sync'}"
                    f" | {decorator}"
                )

    matches = [
        pattern
        for pattern in PATTERNS
        if pattern.lower() in text.lower()
    ]

    if matches:

        print(
            f"\nAUTH SURFACE: "
            f"{path.relative_to(ROOT)}"
            f" -> {', '.join(matches)}"
        )

print("\nAudit complete.")
