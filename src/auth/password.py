"""Password hashing and verification for VolSim-Pro authentication."""

from pwdlib import PasswordHash


password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """Hash a plaintext password using the recommended pwdlib algorithm."""
    if not isinstance(password, str):
        raise TypeError("Password must be a string.")

    if not password:
        raise ValueError("Password cannot be empty.")

    return password_hash.hash(password)


def verify_password(password: str, password_hash_value: str) -> bool:
    """Verify a plaintext password against a stored password hash."""
    if not isinstance(password, str):
        return False

    if not isinstance(password_hash_value, str):
        return False

    if not password_hash_value:
        return False

    return password_hash.verify(password, password_hash_value)
