import requests
from app.config import HUGGINGFACE_API_KEY, HF_MODEL_URL

def classify_image(image_bytes):
    """
    Sends image bytes to HuggingFace image classification model.
    Returns a list of [{label, score}] or an error dict.
    """
    try:
        headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}
        response = requests.post(HF_MODEL_URL, headers=headers, data=image_bytes, timeout=30)
        response.raise_for_status()
        result = response.json()
        # HuggingFace may return an error dict like {"error": "..."} when model is loading
        if isinstance(result, dict) and "error" in result:
            return {"error": result["error"], "classifications": []}
        return result
    except requests.exceptions.RequestException as e:
        return {"error": str(e), "classifications": []}
