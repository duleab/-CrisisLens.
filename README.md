<div align="center">
  <h1>🌍 CrisisLens AI Platform</h1>
  <p><b>Real-time Crisis Detection & Management Powered by Gemma AI</b></p>
  
  [![Hackathon](https://img.shields.io/badge/Hackathon-Build_with_Gemma_AI_2026-blue.svg)](#)
  [![Track](https://img.shields.io/badge/Track-Best_AI_Assistant_for_Social_Impact-green.svg)](#)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
</div>

---

## 📖 Project Overview

**CrisisLens** is a comprehensive, multi-role crisis detection and management platform developed for the **Build with Gemma AI Hackathon 2026 – Nusa Putra University**. By aggregating real-time data from authoritative global sources (USGS, BMKG, WHO, ReliefWeb) and leveraging the advanced reasoning capabilities of **Gemma AI**, CrisisLens provides tailored, life-saving guidance for different personas during natural disasters and emergencies.

This platform moves beyond generic alert systems by offering **Role-Based AI Assistants** that deliver context-aware, highly specific actionable insights for Citizens, Government Officials, Emergency Responders, and Tourists.

### 🏆 Hackathon Tracks Targeted
- **Track 2: Best AI Assistant for Social Impact**
- **Track 3: Most Innovative Gemma Assistant**

---

## ✨ Key Features

- **🧠 Role-Based Gemma AI Assistants**: Intelligent agents providing contextual guidance based on the user's role (e.g., tactical ops for Responders, safety routes for Tourists, policy support for Government).

### 🖥️ Dashboard Interfaces
CrisisLens features tailored dashboards for each user persona to ensure the right information reaches the right people during a crisis:

#### 1. Citizen Dashboard
*Focuses on personal safety, localized alerts, and finding immediate help.*
- **Key Features**: Live crisis map, emergency reporting, nearby shelters, and a crisis summary.
![Citizen Dashboard](./figures/CrisisLens%20citizen%20dashboard%20interface.png)

#### 2. Emergency Responder Dashboard
*Provides tactical oversight, resource management, and precise incident locations.*
- **Key Features**: Active incidents tracking, resource availability (teams, vehicles, shelters), response timeline, and communication logs.
![Emergency Responder Dashboard](./figures/CrisisLens%20AI%20emergency%20response%20dashboard.png)

#### 3. Government Command Center
*Offers high-level strategic intelligence and coordination capabilities.*
- **Key Features**: Overview of total and critical events, crisis type analytics, and quick actions to activate emergency responses or generate situation reports.
![Government Dashboard](./figures/Government%20crisis%20response%20dashboard%20interface.png)

#### 4. Tourist Safety Dashboard
*Ensures visitors stay safe with localized guidance and travel-specific information.*
- **Key Features**: Travel safety score, risk areas, weather updates, itinerary tracking, and quick access to local emergency contacts.
![Tourist Dashboard](./figures/Travel%20safety%20dashboard%20for%20Bali.png)

- **⚡ Real-Time WebSockets**: Live crisis event streaming and instant AI chat responses.
- **🗺️ Interactive Crisis Mapping**: Geographic visualizations of events overlaid with safe zones and hazard indicators.
- **🔄 Multi-Source Data Aggregation**: Background workers continually parse earthquake, weather, and humanitarian APIs.
- **🛡️ Production-Ready Architecture**: Built with scalable microservices, ready for deployment.

---

## 🏗️ System Architecture

Our solution is divided into a robust backend and a dynamic frontend:

- **Backend (FastAPI & Python)**: Handles data ingestion, WebSocket streaming, and interacts with the Google Generative AI API (Gemma) for conversational AI. Relies on **PostgreSQL** for persistence and **Redis** for caching and session state.
- **Frontend (React 18 & Vite)**: A responsive, mobile-first web app utilizing **Tailwind CSS** for UI and **Leaflet** for interactive mapping.
- **Deployment**: Fully containerized with **Docker & Docker Compose** for reproducible environments.

### 📂 Repository Structure

```text
plan-b-webapp/
├── backend/                   # FastAPI backend services
│   ├── app/                   # Application logic (API, Models, Services)
│   ├── tests/                 # Backend unit and integration tests
│   ├── requirements.txt       # Python dependencies
│   └── Dockerfile             # Backend container configuration
├── frontend/                  # React + TypeScript frontend
│   ├── src/                   # Components, Pages, and Hooks
│   ├── public/                # Static assets
│   ├── package.json           # Node dependencies
│   └── Dockerfile             # Frontend container configuration
├── .env.example               # Environment variables template
├── docker-compose.yml         # Container orchestration (Dev/Prod)
└── KAGGLE_WRITEUP.md          # Submission writeup for the Kaggle Hackathon
```

---

## 🚀 Setup Instructions

You can run CrisisLens locally either via Docker (Recommended) or through a manual setup.

### Prerequisites
- [Docker & Docker Compose](https://www.docker.com/) (For Docker setup)
- **Node.js 18+** and **Python 3.11+** (For Manual setup)
- API Keys: `GOOGLE_API_KEY` (Gemma), `NEWSAPI_KEY`, `TELEGRAM_BOT_TOKEN`

### Method A: Docker Compose (Recommended)

1. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Edit .env and insert your GOOGLE_API_KEY and other credentials
   ```

2. **Start the Services:**
   ```bash
   docker-compose up -d --build
   ```

3. **Access the App:**
   - Frontend UI: [http://localhost:3000](http://localhost:3000)
   - Backend API Docs: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)

### Method B: Manual Local Setup

1. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Ensure DATABASE_URL is set to sqlite:///./crisislens.db for local dev without Postgres
   ```

2. **Setup Backend:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Setup Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 🧪 Evaluation & Reproduction (Kaggle Judges)

To evaluate the Gemma AI integration:
1. Ensure the `GOOGLE_API_KEY` is present in the `.env` file.
2. Open the Frontend UI and select a Persona (e.g., "Citizen" or "Emergency Responder").
3. Trigger a crisis event via the map or dashboard.
4. Interact with the Gemma AI Chatbot on the bottom right. Notice how the tone, guidance, and priorities shift drastically depending on the active role.

*Refer to the [KAGGLE_WRITEUP.md](./KAGGLE_WRITEUP.md) for the detailed methodology and approach.*

---

## 🤝 Contributing & License

This project was built for the Build with Gemma AI Hackathon 2026. 
Licensed under the [MIT License](LICENSE).