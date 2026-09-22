"""
VolSim-Pro Provider Abstraction

Provider adapters expose market/venue capabilities to the application.

Providers do NOT:
- bypass risk
- create orders
- execute trades
- own OMS state
- replace the canonical trading-state service
"""
