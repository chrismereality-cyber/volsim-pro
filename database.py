import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------

load_dotenv(dotenv_path=r"C:\volsim-dev\.env")


DATABASE_URL = os.getenv("DATABASE_URL")


if DATABASE_URL:
    DATABASE_URL = DATABASE_URL.strip().strip('"').strip("'")


if not DATABASE_URL:
    raise ValueError(
        "CRITICAL: DATABASE_URL is completely empty inside the loaded environment!"
    )


if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgres://",
        "postgresql://",
        1,
    )


# ---------------------------------------------------------------------------
# SQLAlchemy
# ---------------------------------------------------------------------------

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# SINGLE APPLICATION DECLARATIVE BASE
#
# All SQLAlchemy models must import Base from this module.
#
Base = declarative_base()


# ---------------------------------------------------------------------------
# Dependency
# ---------------------------------------------------------------------------

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()
