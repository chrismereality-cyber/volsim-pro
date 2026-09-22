from __future__ import annotations

import time
from typing import Optional

from src.config.allocation_policy import (
    ALLOCATION_POLICY,
    TRADING_EQUITY_PERCENTAGE,
    VAULT_PERCENTAGE,
)


class CapitalAllocationService:
    """
    VolSim-Pro Capital Allocation Engine.

    Canonical policy:
        70% -> productive trading equity
        30% -> immutable vault

    The allocation policy is owned by:
        src.config.allocation_policy
    """

    TRADING_EQUITY_PERCENTAGE = TRADING_EQUITY_PERCENTAGE
    VAULT_PERCENTAGE = VAULT_PERCENTAGE
    ALLOCATION_PROFILE = ALLOCATION_POLICY.allocation_profile

    def __init__(self):
        self.high_water_mark = 0.0
        self.total_growth_observed = 0.0
        self.total_vault_allocated = 0.0
        self.pending_vault_allocation = 0.0
        self.last_equity = 0.0
        self.last_allocation_time: Optional[float] = None
        self.status = "ONLINE"

    def observe_equity(self, equity: float):
        equity = max(float(equity or 0.0), 0.0)

        self.last_equity = round(equity, 2)

        if self.high_water_mark <= 0.0:
            self.high_water_mark = round(equity, 2)
            return

        if equity > self.high_water_mark:
            growth = round(equity - self.high_water_mark, 2)

            _, vault_growth = ALLOCATION_POLICY.allocate(growth)

            self.total_growth_observed = round(
                self.total_growth_observed + growth,
                2,
            )

            self.pending_vault_allocation = round(
                self.pending_vault_allocation + vault_growth,
                2,
            )

            self.total_vault_allocated = round(
                self.total_vault_allocated + vault_growth,
                2,
            )

            self.high_water_mark = round(equity, 2)
            self.last_allocation_time = time.time()

    def calculate_allocation(self, equity: float) -> dict:
        equity = max(float(equity or 0.0), 0.0)

        trading_equity, vault_equity = ALLOCATION_POLICY.allocate(equity)

        return {
            "profile": self.ALLOCATION_PROFILE,
            "trading_equity_percentage": self.TRADING_EQUITY_PERCENTAGE,
            "vault_percentage": self.VAULT_PERCENTAGE,
            "trading_equity": trading_equity,
            "vault_equity": vault_equity,
        }

    def snapshot(self, equity: float = 0.0) -> dict:
        self.observe_equity(equity)

        allocation = self.calculate_allocation(equity)

        return {
            "status": self.status,
            "profile": self.ALLOCATION_PROFILE,
            "trading_equity_percentage": self.TRADING_EQUITY_PERCENTAGE,
            "vault_percentage": self.VAULT_PERCENTAGE,
            "equity": round(float(equity or 0.0), 2),
            "trading_equity": allocation["trading_equity"],
            "vault_equity": allocation["vault_equity"],
            "high_water_mark": round(self.high_water_mark, 2),
            "total_growth_observed": round(self.total_growth_observed, 2),
            "pending_vault_allocation": round(
                self.pending_vault_allocation,
                2,
            ),
            "total_vault_allocated": round(
                self.total_vault_allocated,
                2,
            ),
            "last_equity": round(self.last_equity, 2),
            "last_allocation_time": self.last_allocation_time,
        }


capital_allocation_service = CapitalAllocationService()
