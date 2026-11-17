from fastapi import FastAPI

app = FastAPI(title="VolSim-Pro Health Service")


@app.get("/", include_in_schema=False)
async def health():
    return {
        "status": "healthy",
        "engine": "VolSim-Pro Core v1.1",
    }
