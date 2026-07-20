from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.risk import risk_engine

app = FastAPI(title="VolSim API")

# Centralized CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
# Note: Ensure risk_engine.py contains a FastAPI APIRouter named 'router'
# If risk_engine uses a different name, update 'risk_engine.router' accordingly
app.include_router(risk_engine.router, prefix="/ws")

if __name__ == "__main__":
    import uvicorn
    # Updated to run from the src package root
    uvicorn.run("src.api.main:app", host="127.0.0.1", port=10000, reload=True)
