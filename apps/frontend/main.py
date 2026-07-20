from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import trading, risk, vault, analytics, robustness

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ... ensure your routes follow here ...
