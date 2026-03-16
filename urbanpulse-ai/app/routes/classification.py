from fastapi import APIRouter, UploadFile, File
from app.services.huggingface_service import classify_image

router = APIRouter(prefix="/ai", tags=["Classification"])

@router.post("/classify")
async def classify_issue(file: UploadFile = File(...)):
    image_bytes = await file.read()
    result = classify_image(image_bytes)
    return result
