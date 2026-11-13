
import os
from dotenv import load_dotenv
import asyncpg
import ssl
import asyncio
import logging

logger = logging.getLogger("volsim.database")

load_dotenv()


class DatabaseService:

    """
    Shared PostgreSQL database adapter.

    Used by:
    - OMS
    - Trade Ledger
    - Vault Ledger
    - Analytics persistence
    """


    def __init__(self):

        self.database_url = os.getenv(
            "DATABASE_URL"
        )

        self.pool = None



    async def connect(self):

        if self.pool:
            return self.pool


        ca_cert_path = os.getenv("DATABASE_SSL_ROOT_CERT")
        if not ca_cert_path:
            raise RuntimeError(
                "DATABASE_SSL_ROOT_CERT must point to the PostgreSQL CA certificate."
            )
        if not os.path.isfile(ca_cert_path):
            raise FileNotFoundError(
                "Configured PostgreSQL CA certificate file does not exist."
            )

        ssl_context = ssl.create_default_context(
            ssl.Purpose.SERVER_AUTH,
            cafile=ca_cert_path,
        )
        ssl_context.verify_mode = ssl.CERT_REQUIRED
        ssl_context.check_hostname = True

        self.pool = await asyncpg.create_pool(
            dsn=self.database_url,
            ssl=ssl_context,
            statement_cache_size=0,
            max_inactive_connection_lifetime=0
        )

        return self.pool



    async def execute(
        self,
        query,
        *args
    ):

        pool = await self.connect()

        async with pool.acquire() as conn:

            return await conn.execute(
                query,
                *args
            )



    async def fetch(
        self,
        query,
        *args
    ):

        pool = await self.connect()

        async with pool.acquire() as conn:

            return await conn.fetch(
                query,
                *args
            )



database_service = DatabaseService()
