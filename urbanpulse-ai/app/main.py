from fastapi import FastAPI
from app.routes import detection
from app.routes import classification
from app.routes import risk_prediction
from app.routes import weather_risk

app = FastAPI(title="UrbanPulse AI Service")

app.include_router(detection.router)
app.include_router(classification.router)
app.include_router(risk_prediction.router)
app.include_router(weather_risk.router)

@app.get("/")
def root():
    return {"message": "UrbanPulse AI running"}
