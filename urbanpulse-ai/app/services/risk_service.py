import math

def predict_risk(rainfall: float, complaints: int, road_density: float) -> float:
    """
    Weighted risk scoring formula (0.0 - 1.0):
    
    - Rainfall contributes 40% (uses log scale: city floods fast, even light rain raises risk)
    - Complaint volume contributes 40% (normalized against a 500-complaint baseline)
    - Road density contributes 20% (higher density = more surface area at risk)
    
    The final score is clamped between 0.05 and 0.98 so it never shows 0% or 100%.
    """
    # Rainfall component: sqrt dampening so even 5mm of rain shows up meaningfully
    max_rain = 50.0   # mm/hr considered extreme
    rain_score = min(math.sqrt(max(rainfall, 0) / max_rain), 1.0)

    # Complaints component: logistic curve peaking at 500 complaints
    complaint_baseline = 500.0
    complaint_score = min(complaints / complaint_baseline, 1.0)

    # Road density component: already 0.0-1.0, higher = more risk surface
    density_score = max(0.0, min(road_density, 1.0))

    # Weighted combination
    raw = (0.40 * rain_score) + (0.40 * complaint_score) + (0.20 * density_score)

    # Clamp between 5% and 98% (never absolute extremes)
    return round(max(0.05, min(raw, 0.98)), 4)

