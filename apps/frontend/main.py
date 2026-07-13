from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import trading, risk, vault, analytics, robustness

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Aligning routes to match the requested paths in your terminal logs
app.include_router(trading.router, prefix='/ws')
app.include_router(vault.router, prefix='/ws')
app.include_router(robustness.router, prefix='/ws')
app.include_router(risk.router, prefix='/ws') # This will make the path /ws/risk
app.include_router(analytics.router, prefix='/api/analytics')

@app.get('/')
async def root():
    return {'status': 'volsim-pro-online'}
