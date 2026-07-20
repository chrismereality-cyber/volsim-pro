import asyncio
import httpx
from managers.global_state_manager import global_state

async def test_integration():
    # 1. Simulate an update from the Risk Engine
    mock_risk_data = {
        'current_drawdown': 1.25,
        'margin_usage': 45.0,
        'risk_score': 0.82
    }
    
    print('Updating Global State with Risk data...')
    global_state.update_component('risk', mock_risk_data)
    
    # 2. Retrieve and print the full state to verify storage
    state = global_state.get_full_state()
    print('Current Global State:', state)
    
    print('Integration test complete. The manager is successfully aggregating state.')

if __name__ == '__main__':
    asyncio.run(test_integration())
