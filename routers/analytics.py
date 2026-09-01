from fastapi import APIRouter, Depends
from src.auth.dependencies import permission_guard

router = APIRouter()

@router.get('/performance')
async def get_performance(
    context=Depends(
        permission_guard("analytics.read")
    ),
):
    # Ensure this returns the structure expected by your frontend
    return {'status': 'success', 'data': {'performance': 0.0}}
