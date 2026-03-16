import os
from dotenv import load_dotenv

load_dotenv()

ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")
ROBOFLOW_WORKFLOW_URL = os.getenv("ROBOFLOW_WORKFLOW_URL")

HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
HF_MODEL_URL = os.getenv("HF_MODEL_URL")

OPENWEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
