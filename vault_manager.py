import datetime
from sqlalchemy.orm import Session
from models import ImmutableVaultState
from web3 import Web3

class ImmutableVaultEngine:
    def __init__(self):
        # Local or isolated web3 utility instance for cryptographic utilities
        self.w3 = Web3()

    def get_allocation_tier(self, trading_equity: float, vault_balance: float):
        total_capital = trading_equity + vault_balance
        if total_capital <= 0:
            return 0.50, 0.50, 50.0

        equity_pct = (trading_equity / total_capital) * 100

        if equity_pct <= 10.0:
            equity_alloc, vault_alloc = 0.10, 0.90
        elif equity_pct <= 20.0:
            equity_alloc, vault_alloc = 0.20, 0.80
        elif equity_pct <= 30.0:
            equity_alloc, vault_alloc = 0.30, 0.70
        elif equity_pct <= 40.0:
            equity_alloc, vault_alloc = 0.40, 0.60
        else:
            equity_alloc, vault_alloc = 0.50, 0.50

        return equity_alloc, vault_alloc, round(equity_pct, 2)

    def generate_state_hash(self, prev_hash: str, equity: float, vault: float, timestamp: str) -> str:
        """
        Generates a secure, deterministic Keccak-256 hash using web3.py 
        to bind the current state to the previous block hash.
        """
        encoded_data = self.w3.solidity_keccak(
            ['string', 'uint256', 'uint256', 'string'],
            [prev_hash, int(equity * 100), int(vault * 100), timestamp]
        )
        return encoded_data.hex()

    def process_profit_event(self, db: Session, realized_profit: float):
        state = db.query(ImmutableVaultState).order_by(ImmutableVaultState.id.desc()).first()
        
        prev_hash = "0x" + "0" * 64
        if not state:
            state = ImmutableVaultState(trading_equity_balance=0.0, vault_balance=0.0)
            db.add(state)
            db.commit()
            db.refresh(state)
            
        if hasattr(state, 'state_hash') and state.state_hash:
            prev_hash = state.state_hash

        if realized_profit <= 0:
            state.trading_equity_balance = max(0.0, state.trading_equity_balance + realized_profit)
        else:
            eq_alloc, vt_alloc, _ = self.get_allocation_tier(state.trading_equity_balance, state.vault_balance)
            state.trading_equity_balance += (realized_profit * eq_alloc)
            state.vault_balance += (realized_profit * vt_alloc)

        now_str = datetime.datetime.utcnow().isoformat()
        state.last_updated = datetime.datetime.utcnow()
        
        # Calculate dynamic cryptographic audit proof using web3
        state.state_hash = self.generate_state_hash(prev_hash, state.trading_equity_balance, state.vault_balance, now_str)
        
        db.commit()
        db.refresh(state)
        return state