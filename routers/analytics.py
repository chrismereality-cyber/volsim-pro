from fastapi import APIRouter

router = APIRouter()

@router.get('/performance')
async def get_performance():
    # Ensure this returns the structure expected by your frontend
    return {'status': 'success', 'data': {'performance': 0.0}}
