# 🏙️ UrbanPulse

**Smart Civic Infrastructure Management & Reporting System**

UrbanPulse is designed to bridge the gap between citizens and municipal authorities. By leveraging AI-powered incident classification, real-time geospatial data, and a robust administrative dashboard, UrbanPulse streamlines the process of reporting and resolving civic issues like potholes, waterlogging, and infrastructure failures.

---

## 🚀 Key Features

- **AI-Driven Reporting**: Automatic classification of civic issues using computer vision (YOLOv8/Roboflow) and pothole detection.
- **Smart Authority Dashboard**: Real-time "Ward Management" with advanced search, status tracking, and performance analytics.
- **Monsoon Intelligence Map**: Live geospatial risk mapping combining real-time weather APIs with citizen-reported flood data.
- **Mobile-First Citizen App**: Seamless incident reporting with live camera capture, automatic geo-tagging (GPS), and reverse geocoding.
- **Real-Time Notifications**: Instant updates for citizens when their reported issues move through the resolution pipeline.
- **Data-Driven Insights**: Transparent tracking of "Resolution Rates" and infrastructure health across different urban wards.

---

## 📂 Project Structure

```text
UrbanPulse/
├── frontend/          # React + Vite + Tailwind CSS (Citizen & Authority UI)
├── backend/           # Node.js + Express + MongoDB (Core API & WebSockets)
├── urbanpulse-ai/     # FastAPI + AI Models (Classification & Detection)
└── README.md          # Project Documentation
```

---

## 🛠️ Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- MongoDB Atlas or Local instance
- Supabase Account (for Authentication)

### 2. Backend Setup (Node.js)
```bash
cd backend
npm install
# Create a .env file with: PORT, MONGO_URI, JWT_SECRET
npm start
```

### 3. AI Microservice Setup (FastAPI)
```bash
cd urbanpulse-ai
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
# Create a .env file with: ROBOFLOW_API_KEY, OPENWEATHER_API_KEY
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend Setup (React/Vite)
```bash
cd frontend
npm install
# Create a .env file with: VITE_API_URL, VITE_AI_URL, VITE_SUPABASE_URL
npm run dev
```

---

## 👨‍💻 Team: The UrbanPulse Collective

This project was built with equal passion and contribution by:
- **Govind Choudhari**
- **Sahil Kale**
- **Nishank Jain**

---

## 🏆 Hackathon Recognition

UrbanPulse was developed for the **Hack Overflow 4.0** hackathon. We would like to express our deepest gratitude to the organizers, mentors, and the community at Hack Overflow 4.0 for providing a platform to innovate for better urban living.

---

*Built with ❤️ for a smarter tomorrow.*