import requests
import base64
from app.config import ROBOFLOW_API_KEY, ROBOFLOW_WORKFLOW_URL

def detect_pothole(image_bytes):
    """
    Sends image to the Roboflow Workflow endpoint for pothole detection.
    The workflow URL is configured via ROBOFLOW_WORKFLOW_URL in .env
    """
    try:
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")
        payload = {
            "api_key": ROBOFLOW_API_KEY,
            "inputs": {
                "image": {
                    "type": "base64",
                    "value": image_b64
                }
            }
        }
        response = requests.post(ROBOFLOW_WORKFLOW_URL, json=payload, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": str(e), "predictions": []}
