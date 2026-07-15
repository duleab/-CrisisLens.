# CrisisLens AI Platform: Build with Gemma AI Hackathon 2026 Writeup

## 1. Project Overview and Problem Statement

When natural disasters or crises occur, information overload and a lack of personalized guidance often lead to panic and inefficient responses. A citizen trying to evacuate needs fundamentally different information than a government official allocating resources or an emergency responder navigating blocked roads. 

**CrisisLens** solves this by offering a real-time crisis detection and management platform featuring **Role-Based Gemma AI Assistants**. We ingest live data from global humanitarian and geographic APIs and synthesize it using Gemma AI to provide context-aware, actionable insights tailored specifically to four personas: Citizens, Government, Emergency Responders, and Tourists.

**Targeted Tracks:**
- Track 2: Best AI Assistant for Social Impact
- Track 3: Most Innovative Gemma Assistant

## 2. Gemma AI Integration

Our solution extensively relies on Google's **Gemma AI** (accessed via the Google Generative AI API) to serve as the core intelligence engine for our role-based dashboards.

- **Context-Aware Prompting:** We inject real-time crisis data (e.g., earthquake magnitude, location, affected population) into the Gemma prompts. 
- **Persona Emulation:** The system uses meta-prompts tailored to each role. For example, when a "Tourist" asks for help, Gemma references the latest embassy advisories and safe travel routes. When an "Emergency Responder" queries the system, Gemma structures the response around tactical operations, resource allocation, and triage.
- **Why Gemma?** Gemma’s open-weight architecture and high reasoning efficiency allowed us to generate highly localized, coherent, and rapid responses without excessive computational overhead.

## 3. Architecture & Technical Stack

The project uses a modern, scalable microservice architecture:

- **Backend:** Python 3.11+, FastAPI, WebSockets (for real-time streaming).
- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite, Leaflet Maps.
- **Database & Cache:** PostgreSQL (persisting event logs) and Redis (handling session state and WebSocket broadcasting).
- **Data Ingestion:** Background workers that continually poll public APIs (USGS, WHO, BMKG) to fetch crisis events.

## 4. Use of External Data and Tools

As per the competition rules, we utilized publicly available external data that is equally accessible to all participants at no cost:
- **USGS API:** For real-time earthquake telemetry.
- **BMKG API:** For localized Indonesian natural disaster warnings.
- **ReliefWeb / WHO APIs:** For humanitarian and health crisis alerts.

*Note on tools: No proprietary or paid-only models were used to generate the logic outside of the allowed usage under the Reasonableness Standard of the rules.*

## 5. Reproduction Instructions

In accordance with Section 2.8 (Winner's Obligations) of the competition rules, this repository contains the complete code required to generate and run the application.

### Hardware & Environment Requirements
- Any standard modern OS (Windows, macOS, Linux).
- Docker and Docker Compose (Recommended) OR Python 3.11+ and Node.js 18+.

### Setup via Docker (Simplest Method)

1. Clone the repository.
2. Duplicate the `.env.example` file and rename it to `.env`.
3. Open `.env` and insert your API keys:
   - `GOOGLE_API_KEY`: Your Gemini/Gemma API key.
   - `NEWSAPI_KEY`: (Optional) for global news fetching.
4. Run the following command in the root directory:
   ```bash
   docker-compose up -d --build
   ```
5. Navigate to `http://localhost:3000` in your browser. 

### Interacting with the AI
- Choose a role (e.g., Citizen) on the landing page.
- Select an active crisis from the map or sidebar.
- Open the AI Chat interface and ask a question (e.g., "What should I do right now?"). The Gemma AI backend will return a response customized to your selected role and the active crisis.

## 6. Future Roadmap

- **Offline-first Capabilities:** Implementing PWA features so Citizens can access cached evacuation routes when cellular networks fail.
- **Multi-Modal Gemma Integration:** Allowing users to upload images of disaster damage for Gemma to analyze and prioritize rescue efforts.
- **Local Gemma Deployment:** Transitioning to running Gemma directly on local edge devices for maximum privacy and resilience.

---

*Submission for the Build with Gemma AI Hackathon 2026 – Nusa Putra University*
