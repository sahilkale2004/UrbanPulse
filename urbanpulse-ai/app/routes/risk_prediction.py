from fastapi import APIRouter
from pydantic import BaseModel
from app.services.risk_service import predict_risk

router = APIRouter(prefix="/ai", tags=["Risk"])

class RiskInput(BaseModel):
    rainfall: float
    complaints: int
    road_density: float

@router.post("/risk-score")
def risk_score(data: RiskInput):
    score = predict_risk(
        data.rainfall,
        data.complaints,
        data.road_density
    )
    return {"risk_score": score}
