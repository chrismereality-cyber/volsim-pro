from typing import Dict, Any

class GlobalStateManager:
    def __init__(self):
        self._state: Dict[str, Any] = {
            'account': {}, 'market': {}, 'execution': {}, 
            'position': {}, 'portfolio': {}, 'risk': {}, 
            'statistics': {}, 'vault': {}, 'ai': {}
        }

    def update_component(self, component: str, data: Dict[str, Any]):
        if component in self._state:
            self._state[component].update(data)

    def get_full_state(self) -> Dict[str, Any]:
        return self._state

# Singleton instance
global_state = GlobalStateManager()
