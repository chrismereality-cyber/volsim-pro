from sqlalchemy import select
from sqlalchemy.orm import Session

from models import RiskPolicy


class RiskPolicyRepository:
    """
    Persistent access to the authoritative risk policy.

    Missing or ambiguous policy state is an error and must never
    silently fall back to hard-coded production limits.
    """

    POLICY_FIELDS = (
        "max_daily_drawdown_percent",
        "risk_per_trade_percent",
        "max_position_size",
        "liquidation_drawdown_percent",
        "liquidation_margin_usage_percent",
    )

    @staticmethod
    def load_policy(db: Session) -> dict:
        """
        Load the single authoritative risk policy from PostgreSQL.

        Raises:
            RuntimeError: if the policy row is missing or ambiguous.
        """

        rows = db.execute(
            select(RiskPolicy).order_by(RiskPolicy.id.asc())
        ).scalars().all()

        if len(rows) != 1:
            raise RuntimeError(
                "Authoritative risk policy must contain exactly one row; "
                f"found {len(rows)}"
            )

        policy = rows[0]

        return {
            field: float(getattr(policy, field))
            for field in RiskPolicyRepository.POLICY_FIELDS
        }


    @staticmethod
    def update_policy(db: Session, policy_values: dict) -> dict:
        """
        Persist the authoritative risk policy in PostgreSQL.

        Validation of policy semantics belongs to RiskEngineService.
        This repository only enforces the singleton persistence invariant
        and commits the supplied values transactionally.
        """

        rows = db.execute(
            select(RiskPolicy).order_by(RiskPolicy.id.asc())
        ).scalars().all()

        if len(rows) != 1:
            raise RuntimeError(
                "Authoritative risk policy must contain exactly one row; "
                f"found {len(rows)}"
            )

        policy = rows[0]

        for field in RiskPolicyRepository.POLICY_FIELDS:
            setattr(policy, field, float(policy_values[field]))

        db.commit()
        db.refresh(policy)

        return {
            field: float(getattr(policy, field))
            for field in RiskPolicyRepository.POLICY_FIELDS
        }
