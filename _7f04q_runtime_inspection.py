import asyncio
import json

from src.services.database_service import database_service
from src.services.global_trading_state_service import global_trading_state_service

async def main():
    await database_service.connect()

    state = global_trading_state_service.snapshot()

    result = {
        "ai_decision": state.get("ai_decision"),
        "ai_execution": state.get("ai_execution"),
        "execution_risk": state.get("execution_risk"),
        "order_builder": state.get("order_builder"),
        "ai_execution_orchestrator": state.get("ai_execution_orchestrator"),
        "execution_queue": state.get("execution_queue"),
    }

    print(json.dumps(result, indent=2, default=str))

asyncio.run(main())
