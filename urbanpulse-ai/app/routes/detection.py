from fastapi import APIRouter, UploadFile, File
from app.services.roboflow_service import detect_pothole

router = APIRouter(prefix="/ai", tags=["Detection"])

@router.post("/detect-pothole")
async def pothole_detection(file: UploadFile = File(...)):
    image_bytes = await file.read()
    result = detect_pothole(image_bytes)
    return result
