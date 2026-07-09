from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import trading, risk

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
app.include_router(trading.router, prefix="/ws")
app.include_router(risk.router, prefix="/ws")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8080, reload=True)
