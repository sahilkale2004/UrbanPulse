from fastapi import APIRouter
from app.services.weather_service import get_weather

router = APIRouter(prefix="/ai", tags=["Weather"])

@router.get("/weather")
def weather(lat: float, lon: float):
    data = get_weather(lat, lon)
    rainfall = data.get("rain", {}).get("1h", 0)
    return {
        "rainfall_last_hour": rainfall,
        "weather_data": data
    }
