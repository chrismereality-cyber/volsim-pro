"""
VolSim-Pro Canonical Capital Allocation Policy

Single source of truth for profit allocation.

Policy:
    70% -> Trading Equity
    30% -> Immutable Vault

The trading allocation remains productive capital and may
participate in future compounding.

The vault allocation is protected from trading margin.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class AllocationPolicy:
    allocation_profile: str = "CORE_SATELLITE_70_30"
    equity_percentage: float = 70.0
    vault_percentage: float = 30.0

    def __post_init__(self):
        total = round(
            self.equity_percentage + self.vault_percentage,
            10,
        )

        if not 0.0 <= self.equity_percentage <= 100.0:
            raise ValueError(
                "equity_percentage must be between 0 and 100"
            )

        if not 0.0 <= self.vault_percentage <= 100.0:
            raise ValueError(
                "vault_percentage must be between 0 and 100"
            )

        if total != 100.0:
            raise ValueError(
                "equity_percentage + vault_percentage must equal 100"
            )

    def allocate(self, profit: float) -> tuple[float, float]:
        """
        Split NEW realized profit.

        Returns:
            (trading_equity_amount, vault_amount)
        """

        profit = max(float(profit or 0.0), 0.0)

        equity_amount = round(
            profit * self.equity_percentage / 100.0,
            2,
        )

        vault_amount = round(
            profit * self.vault_percentage / 100.0,
            2,
        )

        return equity_amount, vault_amount

    def as_dict(self) -> dict:
        return {
            "allocation_profile": self.allocation_profile,
            "equity_percentage": self.equity_percentage,
            "vault_percentage": self.vault_percentage,
        }


# ------------------------------------------------------------------
# Canonical VolSim-Pro policy
# ------------------------------------------------------------------

ALLOCATION_POLICY = AllocationPolicy()

ALLOCATION_PROFILE = ALLOCATION_POLICY.allocation_profile
TRADING_EQUITY_PERCENTAGE = ALLOCATION_POLICY.equity_percentage
VAULT_PERCENTAGE = ALLOCATION_POLICY.vault_percentage
