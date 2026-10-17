from fastapi import APIRouter, Depends, HTTPException
from src.auth.dependencies import permission_guard
from src.services.statistics_service import statistics_service

router = APIRouter()


@router.get('/performance')
async def get_performance(
    timeframe: str = "30D",
    context=Depends(
        permission_guard("analytics.read")
    ),
):
    timeframe = str(timeframe or "30D").upper()

    if timeframe not in {"30D", "90D", "ALL"}:
        raise HTTPException(
            status_code=400,
            detail="Unsupported timeframe. Expected 30D, 90D, or ALL.",
        )

    return statistics_service.performance_analytics(timeframe)
