from pathlib import Path
import os

from dotenv import load_dotenv


PROJECT_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE = PROJECT_ROOT / ".env"
ENV_LOCAL_FILE = PROJECT_ROOT / ".env.local"


def load_environment() -> None:
    """
    Load VolSim-Pro backend environment configuration.

    Priority:
        1. Existing process environment
        2. .env.local
        3. .env

    Existing process variables are never overwritten.
    """

    if not ENV_FILE.exists():
        raise RuntimeError(
            f"VolSim-Pro environment file not found: {ENV_FILE}"
        )

    load_dotenv(
        dotenv_path=ENV_FILE,
        override=False,
    )

    if ENV_LOCAL_FILE.exists():
        load_dotenv(
            dotenv_path=ENV_LOCAL_FILE,
            override=False,
        )


def environment_status() -> dict:
    """
    Return non-secret environment diagnostics.
    """

    sensitive_names = {
        "TRADING_ECONOMICS_API_KEY",
        "TRADING_ECONOMICS_CLIENT",
        "SENTIMENT_API_KEY",
    }

    names = [
        "VOLSIM_EXECUTION_MODE",
        "NEWS_FILTER_ENABLED",
        "NEWS_PROVIDER",
        "TRADING_ECONOMICS_API_KEY",
        "TRADING_ECONOMICS_CLIENT",
        "NEWS_FAIL_CLOSED",
        "SENTIMENT_ENABLED",
        "SENTIMENT_PROVIDER",
        "SENTIMENT_URL",
        "SENTIMENT_API_KEY",
    ]

    result = {}

    for name in names:

        value = os.getenv(name)

        if name in sensitive_names:

            if value:
                result[name] = (
                    f"<CONFIGURED length={len(value)}>"
                )
            else:
                result[name] = "<NOT CONFIGURED>"

        else:

            result[name] = (
                value
                if value is not None
                else "<NOT SET>"
            )

    return result


load_environment()
