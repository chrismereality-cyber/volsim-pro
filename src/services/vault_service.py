from __future__ import annotations

import time
import uuid
import hashlib
import json
import asyncio

from src.services.database_service import database_service
from typing import Optional

from src.config.allocation_policy import (
    ALLOCATION_POLICY,
    ALLOCATION_PROFILE,
    TRADING_EQUITY_PERCENTAGE,
    VAULT_PERCENTAGE,
)


class VaultService:
    """
    VolSim-Pro Immutable Vault Service.

    Responsibilities:
    - Maintain immutable-vault accounting state.
    - Calculate the canonical equity/vault allocation split.
    - Track cumulative realized-profit processing.
    - Track pending vault allocations.
    - Track cumulative allocations and transfers.
    - Expose synchronization state to global trading state.

    Does NOT own:
    - execution
    - portfolio
    - risk
    - statistics
    - AI
    - telemetry
    - counter-trend execution

    Allocation policy:

        50% -> Trading Equity
        50% -> Immutable Vault

    The vault portion is protected from becoming trading margin.
    """

    # Canonical allocation policy.
    #
    # Source of truth:
    #     src/config/allocation_policy.py
    #
    # Current policy:
    #     50% -> Trading Equity
    #     50% -> Immutable Vault

    EQUITY_ALLOCATION_PERCENT = ALLOCATION_POLICY.equity_percentage
    VAULT_ALLOCATION_PERCENT = ALLOCATION_POLICY.vault_percentage
    ALLOCATION_PROFILE = ALLOCATION_POLICY.allocation_profile

    if round(
        EQUITY_ALLOCATION_PERCENT
        + VAULT_ALLOCATION_PERCENT,
        6,
    ) != 100.0:
        raise ValueError(
            "Allocation policy must total 100%"
        )

    def __init__(self):

        # --------------------------------------------------------------
        # Vault accounting
        # --------------------------------------------------------------

        self.vault_balance = 0.0

        self.pending_allocation = 0.0

        self.total_allocated = 0.0

        self.total_transferred = 0.0

        # --------------------------------------------------------------
        # Persistent database state
        # --------------------------------------------------------------

        self.database_state_id = 1

        self.persistence_enabled = True

        self.last_persist_time = None

        self.last_persist_error = None

        self._database_load_attempted = False


        # --------------------------------------------------------------
        # Profit processing watermark
        # --------------------------------------------------------------
        #
        # PortfolioService supplies cumulative realized P/L.
        #
        # Example:
        #
        # previous = 100
        # current  = 125
        # delta    = 25
        #
        # Only the delta is allocated.
        #
        # This prevents repeated global-state snapshots from
        # allocating the same realized profit more than once.
        #

        self.last_realized_profit = 0.0

        # --------------------------------------------------------------
        # Blockchain state
        # --------------------------------------------------------------

        self.wallet_address: Optional[str] = None

        self.last_tx_hash: Optional[str] = None

        self.blockchain_network: Optional[str] = None

        self.last_sync_time: Optional[float] = None

        self.sync_status = "PENDING"

        self.status = "ONLINE"

    # ------------------------------------------------------------------
    # Allocation policy
    # ------------------------------------------------------------------

    def allocation_policy(self) -> dict:

        return {

            "equity_percentage":
                self.EQUITY_ALLOCATION_PERCENT,

            "vault_percentage":
                self.VAULT_ALLOCATION_PERCENT,

        }

    # ------------------------------------------------------------------
    # Profit allocation calculation
    # ------------------------------------------------------------------

    def calculate_allocation(
        self,
        realized_profit: float,
    ) -> dict:
        """
        Calculate the canonical allocation for a profit amount.

        Negative values do not generate a vault allocation.
        """

        profit = max(
            float(realized_profit),
            0.0
        )

        equity_amount = round(
            profit
            * (
                self.EQUITY_ALLOCATION_PERCENT
                / 100.0
            ),
            2,
        )

        vault_amount = round(
            profit
            * (
                self.VAULT_ALLOCATION_PERCENT
                / 100.0
            ),
            2,
        )

        return {

            "realized_profit":
                round(profit, 2),

            "equity_amount":
                equity_amount,

            "vault_amount":
                vault_amount,

            "equity_percentage":
                self.EQUITY_ALLOCATION_PERCENT,

            "vault_percentage":
                self.VAULT_ALLOCATION_PERCENT,

        }

    # ------------------------------------------------------------------
    # Register cumulative realized profit
    # ------------------------------------------------------------------

    # ------------------------------------------------------------------
    # Database persistence
    # ------------------------------------------------------------------

    def _generate_audit_hash(
        self,
        realized_profit: float,
        equity_amount: float,
        vault_amount: float,
        trade_id: str,
    ) -> str:
        """
        Generate an immutable audit hash for a vault allocation event.
        """

        payload = {
            "allocation_profile":
                self.ALLOCATION_PROFILE,

            "equity_percentage":
                self.EQUITY_ALLOCATION_PERCENT,

            "vault_percentage":
                self.VAULT_ALLOCATION_PERCENT,

            "realized_profit":
                round(float(realized_profit), 2),

            "equity_amount":
                round(float(equity_amount), 2),

            "vault_amount":
                round(float(vault_amount), 2),

            "trade_id":
                trade_id,
        }

        encoded = json.dumps(
            payload,
            sort_keys=True,
            separators=(",", ":"),
        ).encode("utf-8")

        return hashlib.sha256(
            encoded
        ).hexdigest()


    async def load_persistent_state(self):
        """
        Restore vault state from immutable_vault_state.

        This is intentionally separate from __init__ because the shared
        DatabaseService is asynchronous.
        """

        if self._database_load_attempted:
            return self.snapshot()

        self._database_load_attempted = True

        if not self.persistence_enabled:
            return self.snapshot()

        try:

            rows = await database_service.fetch(
                """
                SELECT
                    id,
                    trading_equity_balance,
                    vault_balance,
                    allocation_profile,
                    equity_percentage,
                    vault_percentage,
                    pending_vault_allocation,
                    total_allocated,
                    total_transferred,
                    sync_status,
                    wallet_address,
                    blockchain_network,
                    last_tx_hash,
                    last_sync_time
                FROM public.immutable_vault_state
                ORDER BY id
                LIMIT 1
                """
            )

            if not rows:
                logger_warning = getattr(
                    self,
                    "_logger_warning",
                    print
                )

                logger_warning(
                    "No immutable_vault_state row found; "
                    "using application defaults."
                )

                return self.snapshot()

            row = rows[0]

            # ----------------------------------------------------------
            # Only restore compatible 70/30 policy state.
            # ----------------------------------------------------------

            db_profile = row["allocation_profile"]

            db_equity = (
                float(row["equity_percentage"])
                if row["equity_percentage"] is not None
                else None
            )

            db_vault = (
                float(row["vault_percentage"])
                if row["vault_percentage"] is not None
                else None
            )

            if (
                db_profile != self.ALLOCATION_PROFILE
                or db_equity != self.EQUITY_ALLOCATION_PERCENT
                or db_vault != self.VAULT_ALLOCATION_PERCENT
            ):

                raise RuntimeError(
                    "Database allocation policy mismatch: "
                    f"profile={db_profile!r}, "
                    f"equity={db_equity!r}, "
                    f"vault={db_vault!r}; "
                    "application policy is "
                    f"{self.ALLOCATION_PROFILE} "
                    f"{self.EQUITY_ALLOCATION_PERCENT}/"
                    f"{self.VAULT_ALLOCATION_PERCENT}"
                )

            self.database_state_id = row["id"]

            self.vault_balance = float(
                row["vault_balance"] or 0.0
            )

            self.pending_allocation = float(
                row["pending_vault_allocation"] or 0.0
            )

            self.total_allocated = float(
                row["total_allocated"] or 0.0
            )

            self.total_transferred = float(
                row["total_transferred"] or 0.0
            )

            self.sync_status = (
                row["sync_status"]
                or "PENDING"
            )

            self.wallet_address = (
                row["wallet_address"]
            )

            self.blockchain_network = (
                row["blockchain_network"]
            )

            self.last_tx_hash = (
                row["last_tx_hash"]
            )

            self.last_sync_time = (
                row["last_sync_time"].timestamp()
                if row["last_sync_time"] is not None
                else None
            )

            print(
                "VaultService persistent state restored:",
                {
                    "profile":
                        self.ALLOCATION_PROFILE,

                    "vault_balance":
                        self.vault_balance,

                    "pending_allocation":
                        self.pending_allocation,

                    "total_allocated":
                        self.total_allocated,

                    "total_transferred":
                        self.total_transferred,

                    "sync_status":
                        self.sync_status,
                }
            )

            return self.snapshot()

        except Exception as exc:

            self.last_persist_error = str(exc)

            print(
                "VaultService database load warning:",
                str(exc)
            )

            return self.snapshot()


    async def persist_state(
        self,
        *,
        realized_profit: float | None = None,
        equity_amount: float = 0.0,
        vault_amount: float = 0.0,
        create_ledger: bool = False,
    ):
        """
        Persist current vault state and optionally create a vault ledger
        allocation record.

        The database remains the durable state layer.
        """

        if not self.persistence_enabled:
            return self.snapshot()

        try:

            # ----------------------------------------------------------
            # Deterministic allocation identity
            #
            # The same realized-profit event must produce the same
            # trade_id on every retry. This allows the existing UNIQUE
            # vault_ledger.trade_id constraint to provide idempotency.
            # ----------------------------------------------------------

            import hashlib

            allocation_source = (
                f"{self.ALLOCATION_PROFILE}|"
                f"{float(realized_profit or 0.0):.8f}|"
                f"{float(equity_amount):.8f}|"
                f"{float(vault_amount):.8f}"
            )

            allocation_key = hashlib.sha256(
                allocation_source.encode("utf-8")
            ).hexdigest()[:32]

            trade_id = "VAULT-PROFIT-" + allocation_key

            # ----------------------------------------------------------
            # ATOMIC DATABASE TRANSACTION
            #
            # Allocation lookup, ledger insertion, and immutable state
            # update all execute on the SAME PostgreSQL connection.
            # ----------------------------------------------------------

            async with database_service.transaction() as conn:

                existing = await conn.fetch(
                    """
                    SELECT
                        id,
                        equity_amount,
                        vault_amount
                    FROM public.vault_ledger
                    WHERE trade_id = $1
                    LIMIT 1
                    """,
                    trade_id,
                )

                allocation_already_persisted = bool(existing)

                if not allocation_already_persisted:

                    audit_hash = self._generate_audit_hash(
                        realized_profit or 0.0,
                        equity_amount,
                        vault_amount,
                        trade_id,
                    )

                    insert_result = await conn.execute(
                        """
                        INSERT INTO public.vault_ledger
                        (
                            balance,
                            allocated_from,
                            trade_id,
                            audit_hash,
                            equity_amount,
                            vault_amount,
                            allocation_profile,
                            blockchain_status,
                            tx_hash,
                            confirmation_count
                        )
                        VALUES
                        (
                            $1,
                            $2,
                            $3,
                            $4,
                            $5,
                            $6,
                            $7,
                            'PENDING',
                            NULL,
                            0
                        )
                        ON CONFLICT (trade_id) DO NOTHING
                        """,

                        float(self.vault_balance),
                        float(realized_profit or 0.0),
                        trade_id,
                        audit_hash,
                        float(equity_amount),
                        float(vault_amount),
                        self.ALLOCATION_PROFILE,
                    )

                    allocation_inserted = insert_result.endswith("1")

                    if allocation_inserted:

                        await conn.execute(
                            """
                            UPDATE public.immutable_vault_state
                            SET
                                trading_equity_balance = COALESCE(
                                    trading_equity_balance,
                                    0
                                ) + $1,

                                vault_balance = $2,

                                allocation_profile = $3,

                                equity_percentage = $4,

                                vault_percentage = $5,

                                pending_vault_allocation = $6,

                                total_allocated = $7,

                                total_transferred = $8,

                                sync_status = $9,

                                wallet_address = $10,

                                blockchain_network = $11,

                                last_tx_hash = $12,

                                last_updated = NOW(),

                                last_sync_time = NOW()

                            WHERE id = $13
                            """,

                            float(equity_amount),
                            float(self.vault_balance),
                            self.ALLOCATION_PROFILE,
                            float(self.EQUITY_ALLOCATION_PERCENT),
                            float(self.VAULT_ALLOCATION_PERCENT),
                            float(self.pending_allocation),
                            float(self.total_allocated),
                            float(self.total_transferred),
                            self.sync_status,
                            self.wallet_address,
                            self.blockchain_network,
                            self.last_tx_hash,
                            self.database_state_id,
                        )

                        print(
                            "VaultService atomic persistence: "
                            f"allocation committed ({trade_id})"
                        )

                    else:

                        print(
                            "VaultService idempotency: "
                            f"allocation already persisted ({trade_id})"
                        )

                else:

                    print(
                        "VaultService idempotency: "
                        f"allocation already persisted ({trade_id})"
                    )


            self.last_persist_time = time.time()

            self.last_persist_error = None

            return self.snapshot()

        except Exception as exc:

            self.last_persist_error = str(exc)

            self.sync_status = "PERSISTENCE_ERROR"

            print(
                "VaultService persistence error:",
                str(exc)
            )

            raise


    def schedule_persist(
        self,
        *,
        realized_profit: float | None = None,
        equity_amount: float = 0.0,
        vault_amount: float = 0.0,
        create_ledger: bool = False,
    ):
        """
        Schedule asynchronous persistence when a running event loop exists.

        This preserves the existing synchronous service API.
        """

        try:

            loop = asyncio.get_running_loop()

        except RuntimeError:

            return False

        loop.create_task(
            self.persist_state(
                realized_profit=realized_profit,
                equity_amount=equity_amount,
                vault_amount=vault_amount,
                create_ledger=create_ledger,
            )
        )

        return True


    def register_profit(
        self,
        realized_profit: float,
    ) -> dict:
        """
        Register cumulative realized P/L.

        Only NEW positive realized profit is allocated.

        Example:

            register_profit(100)
                -> allocate 100

            register_profit(100)
                -> allocate 0

            register_profit(125)
                -> allocate 25

        This makes the operation safe for repeated global-state
        snapshots.
        """

        current_realized_profit = max(
            float(realized_profit),
            0.0
        )

        previous_realized_profit = (
            self.last_realized_profit
        )

        # --------------------------------------------------------------
        # Detect a realized-profit reset.
        #
        # This can happen when the trading session/day/account context
        # resets its cumulative realized P/L.
        #
        # We do not create a negative vault allocation.
        # --------------------------------------------------------------

        if current_realized_profit < previous_realized_profit:

            self.last_realized_profit = (
                current_realized_profit
            )

            return {

                "realized_profit":
                    round(
                        current_realized_profit,
                        2
                    ),

                "previous_realized_profit":
                    round(
                        previous_realized_profit,
                        2
                    ),

                "new_profit":
                    0.0,

                "equity_amount":
                    0.0,

                "vault_amount":
                    0.0,

                "equity_percentage":
                    self.EQUITY_ALLOCATION_PERCENT,

                "vault_percentage":
                    self.VAULT_ALLOCATION_PERCENT,

                "status":
                    "RESET_DETECTED",

            }

        # --------------------------------------------------------------
        # Calculate NEW profit only.
        # --------------------------------------------------------------

        new_profit = round(
            current_realized_profit
            - previous_realized_profit,
            2,
        )

        # Update watermark BEFORE returning.
        #
        # This makes repeated calls against the same cumulative
        # realized P/L idempotent.
        self.last_realized_profit = (
            current_realized_profit
        )

        if new_profit <= 0:

            return {

                "realized_profit":
                    round(
                        current_realized_profit,
                        2
                    ),

                "previous_realized_profit":
                    round(
                        previous_realized_profit,
                        2
                    ),

                "new_profit":
                    0.0,

                "equity_amount":
                    0.0,

                "vault_amount":
                    0.0,

                "equity_percentage":
                    self.EQUITY_ALLOCATION_PERCENT,

                "vault_percentage":
                    self.VAULT_ALLOCATION_PERCENT,

                "status":
                    "NO_NEW_PROFIT",

            }

        # --------------------------------------------------------------
        # Apply canonical allocation policy to NEW profit.
        # --------------------------------------------------------------

        allocation = self.calculate_allocation(
            new_profit
        )

        equity_amount = allocation[
            "equity_amount"
        ]

        vault_amount = allocation[
            "vault_amount"
        ]

        # --------------------------------------------------------------
        # Vault side.
        #
        # The 70% equity amount is deliberately NOT added to the vault.
        # It remains part of the trading/equity accounting layer.
        # --------------------------------------------------------------

        if vault_amount > 0:

            self.pending_allocation = round(
                self.pending_allocation
                + vault_amount,
                2,
            )

            self.total_allocated = round(
                self.total_allocated
                + vault_amount,
                2,
            )

            self.sync_status = "PENDING"

        # --------------------------------------------------------------
        # Persist the allocation.
        #
        # The 70% equity portion is recorded in the ledger as part of
        # the allocation event but is NOT added to the immutable vault.
        #
        # The 30% vault portion becomes pending until explicitly
        # transferred by record_transfer().
        # --------------------------------------------------------------

        self.schedule_persist(
            realized_profit=current_realized_profit,
            equity_amount=equity_amount,
            vault_amount=vault_amount,
            create_ledger=True,
        )

        return {

            "realized_profit":
                round(
                    current_realized_profit,
                    2
                ),

            "previous_realized_profit":
                round(
                    previous_realized_profit,
                    2
                ),

            "new_profit":
                new_profit,

            "equity_amount":
                equity_amount,

            "vault_amount":
                vault_amount,

            "equity_percentage":
                self.EQUITY_ALLOCATION_PERCENT,

            "vault_percentage":
                self.VAULT_ALLOCATION_PERCENT,

            "status":
                "ALLOCATED",

        }

    # ------------------------------------------------------------------
    # Mark vault transfer
    # ------------------------------------------------------------------

    async def record_transfer(
        self,
        amount: float,
        tx_hash: Optional[str] = None,
        blockchain_network: Optional[str] = None,
        blockchain_status: str = "CONFIRMED",
        confirmation_count: int = 0,
    ) -> dict:
        """
        Persist a successful immutable-vault transfer atomically.

        The blockchain interaction itself remains outside this service.

        This method is responsible for the durable accounting transition:

            pending_vault_allocation
                    ↓
                vault_balance
                    +
                total_transferred

        Idempotency is enforced using tx_hash.
        """

        transfer_amount = max(
            float(amount),
            0.0,
        )

        if transfer_amount <= 0:
            raise ValueError(
                "Transfer amount must be greater than zero."
            )

        if not tx_hash:
            raise ValueError(
                "tx_hash is required for a durable vault transfer."
            )

        if not blockchain_status:
            blockchain_status = "CONFIRMED"

        confirmation_count = max(
            int(confirmation_count),
            0,
        )

        # --------------------------------------------------------------
        # ATOMIC DATABASE TRANSACTION
        # --------------------------------------------------------------

        try:

            async with database_service.transaction() as conn:

                # ------------------------------------------------------
                # Lock immutable vault state.
                #
                # This prevents two concurrent transfer operations from
                # spending the same pending allocation.
                # ------------------------------------------------------

                state = await conn.fetchrow(
                    """
                    SELECT
                        id,
                        vault_balance,
                        pending_vault_allocation,
                        total_allocated,
                        total_transferred,
                        wallet_address,
                        last_tx_hash,
                        blockchain_network,
                        sync_status
                    FROM public.immutable_vault_state
                    WHERE id = $1
                    FOR UPDATE
                    """,
                    self.database_state_id,
                )

                if not state:
                    raise RuntimeError(
                        "Immutable vault state row not found."
                    )

                database_pending = float(
                    state["pending_vault_allocation"] or 0.0
                )

                database_vault_balance = float(
                    state["vault_balance"] or 0.0
                )

                database_total_transferred = float(
                    state["total_transferred"] or 0.0
                )

                # ------------------------------------------------------
                # Idempotency check.
                #
                # A blockchain transaction can be observed more than
                # once. Never credit the same tx_hash twice.
                # ------------------------------------------------------

                existing_transfer = await conn.fetchrow(
                    """
                    SELECT
                        id,
                        transfer_id,
                        amount,
                        blockchain_status,
                        tx_hash
                    FROM public.vault_transfer
                    WHERE tx_hash = $1
                    LIMIT 1
                    """,
                    tx_hash,
                )

                if existing_transfer:

                    print(
                        "VaultService transfer idempotency: "
                        f"transaction already persisted ({tx_hash})"
                    )

                    # Restore the in-memory state from the durable row
                    # rather than applying the transfer again.

                    self.vault_balance = database_vault_balance
                    self.pending_allocation = database_pending
                    self.total_transferred = (
                        database_total_transferred
                    )

                    self.last_tx_hash = state["last_tx_hash"]

                    self.blockchain_network = (
                        state["blockchain_network"]
                    )

                    self.sync_status = (
                        state["sync_status"] or "PENDING"
                    )

                    return self.snapshot()

                # ------------------------------------------------------
                # Validate available pending allocation.
                # ------------------------------------------------------

                if transfer_amount > database_pending:
                    raise ValueError(
                        "Transfer amount exceeds pending vault "
                        f"allocation: requested={transfer_amount}, "
                        f"pending={database_pending}"
                    )

                # ------------------------------------------------------
                # Generate deterministic transfer identity.
                #
                # tx_hash is the external idempotency identity.
                # The transfer_id gives the database event its own
                # internal namespace.
                # ------------------------------------------------------

                import hashlib

                transfer_source = (
                    f"{self.ALLOCATION_PROFILE}|"
                    f"{tx_hash}|"
                    f"{transfer_amount:.8f}"
                )

                transfer_key = hashlib.sha256(
                    transfer_source.encode("utf-8")
                ).hexdigest()[:32]

                transfer_id = (
                    "VAULT-TRANSFER-"
                    + transfer_key
                )

                audit_payload = {
                    "transfer_id": transfer_id,
                    "tx_hash": tx_hash,
                    "amount": round(
                        transfer_amount,
                        8,
                    ),
                    "blockchain_network":
                        blockchain_network,
                    "allocation_profile":
                        self.ALLOCATION_PROFILE,
                }

                audit_hash = hashlib.sha256(
                    str(
                        sorted(
                            audit_payload.items()
                        )
                    ).encode("utf-8")
                ).hexdigest()

                # ------------------------------------------------------
                # Find the most recent allocation associated with the
                # pending vault balance.
                #
                # This is a reference only. Transfer accounting itself
                # is maintained at the aggregate vault-state level.
                # ------------------------------------------------------

                allocation_row = await conn.fetchrow(
                    """
                    SELECT trade_id
                    FROM public.vault_ledger
                    WHERE vault_amount > 0
                      AND allocation_profile = $1
                    ORDER BY created_at DESC, id DESC
                    LIMIT 1
                    """,
                    self.ALLOCATION_PROFILE,
                )

                allocation_trade_id = (
                    allocation_row["trade_id"]
                    if allocation_row
                    else "VAULT-PENDING-POOL"
                )

                # ------------------------------------------------------
                # Create durable transfer event.
                # ------------------------------------------------------

                insert_result = await conn.execute(
                    """
                    INSERT INTO public.vault_transfer
                    (
                        transfer_id,
                        allocation_trade_id,
                        amount,
                        blockchain_network,
                        wallet_address,
                        tx_hash,
                        blockchain_status,
                        confirmation_count,
                        audit_hash
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7,
                        $8,
                        $9
                    )
                    ON CONFLICT (transfer_id) DO NOTHING
                    """,
                    transfer_id,
                    allocation_trade_id,
                    transfer_amount,
                    blockchain_network,
                    state["wallet_address"],
                    tx_hash,
                    blockchain_status,
                    confirmation_count,
                    audit_hash,
                )

                transfer_inserted = (
                    insert_result.endswith("1")
                )

                if not transfer_inserted:

                    print(
                        "VaultService transfer idempotency: "
                        f"transfer already exists ({transfer_id})"
                    )

                    self.vault_balance = database_vault_balance
                    self.pending_allocation = database_pending
                    self.total_transferred = (
                        database_total_transferred
                    )

                    return self.snapshot()

                # ------------------------------------------------------
                # Calculate new durable state.
                # ------------------------------------------------------

                new_pending = round(
                    database_pending
                    - transfer_amount,
                    2,
                )

                new_vault_balance = round(
                    database_vault_balance
                    + transfer_amount,
                    2,
                )

                new_total_transferred = round(
                    database_total_transferred
                    + transfer_amount,
                    2,
                )

                new_sync_status = (
                    "SYNCED"
                    if new_pending <= 0
                    else "PENDING"
                )

                # ------------------------------------------------------
                # Persist immutable vault state.
                # ------------------------------------------------------

                await conn.execute(
                    """
                    UPDATE public.immutable_vault_state
                    SET
                        vault_balance = $1,
                        pending_vault_allocation = $2,
                        total_transferred = $3,
                        sync_status = $4,
                        last_tx_hash = $5,
                        blockchain_network = $6,
                        last_sync_time = NOW(),
                        last_updated = NOW()
                    WHERE id = $7
                    """,
                    new_vault_balance,
                    new_pending,
                    new_total_transferred,
                    new_sync_status,
                    tx_hash,
                    blockchain_network,
                    self.database_state_id,
                )

                # ------------------------------------------------------
                # Update in-memory state only after both DB operations
                # have succeeded.
                # ------------------------------------------------------

                self.vault_balance = new_vault_balance
                self.pending_allocation = new_pending
                self.total_transferred = (
                    new_total_transferred
                )

                self.last_tx_hash = tx_hash
                self.blockchain_network = (
                    blockchain_network
                )

                self.last_sync_time = time.time()

                self.sync_status = new_sync_status

                print(
                    "VaultService transfer committed: "
                    f"{transfer_amount:.2f} "
                    f"tx={tx_hash}"
                )

                return self.snapshot()

        except Exception as exc:

            self.last_persist_error = str(exc)

            print(
                "VaultService transfer persistence error:",
                str(exc),
            )

            raise

    # ------------------------------------------------------------------
    # Snapshot
    # ------------------------------------------------------------------

    def snapshot(self) -> dict:

        return {

            "status":
                self.status,

            "vault_balance":
                round(
                    self.vault_balance,
                    2
                ),

            "pending_allocation":
                round(
                    self.pending_allocation,
                    2
                ),

            "total_allocated":
                round(
                    self.total_allocated,
                    2
                ),

            "total_transferred":
                round(
                    self.total_transferred,
                    2
                ),

            "last_realized_profit":
                round(
                    self.last_realized_profit,
                    2
                ),

            "equity_percentage":
                self.EQUITY_ALLOCATION_PERCENT,

            "vault_percentage":
                self.VAULT_ALLOCATION_PERCENT,

            "sync_status":
                self.sync_status,

            "wallet_address":
                self.wallet_address,

            "last_tx_hash":
                self.last_tx_hash,

            "blockchain_network":
                self.blockchain_network,

            "last_sync_time":
                self.last_sync_time,

            "database_state_id":
                self.database_state_id,

            "last_persist_time":
                self.last_persist_time,

            "last_persist_error":
                self.last_persist_error,

            "persistence_enabled":
                self.persistence_enabled,

        }


vault_service = VaultService()
