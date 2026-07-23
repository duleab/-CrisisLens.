# 🌍 CrisisLens — Automated Crisis Intelligence Platform

[![CrisisLens Daily Pipeline](https://github.com/duleab/crisislens-webapp/actions/workflows/daily_pipeline.yml/badge.svg)](https://github.com/duleab/crisislens-webapp/actions/workflows/daily_pipeline.yml)

> Real-time crisis monitoring for Southeast Asia — powered by USGS, BMKG, WHO, GDACS & ReliefWeb.

CrisisLens is an AI-powered crisis intelligence platform that automatically collects, classifies, and visualizes disaster data from trusted sources every day. Built to support citizens, emergency responders, tourists, and government officials with role-aware AI briefings.

---

## 🚀 Features

- **Live Data Pipeline** — collects earthquakes, floods, disease outbreaks, and more from 6 verified sources
- **Role-Aware AI Assistant** — powered by Gemini 2.0, responds differently for Citizens, Responders, Government, and Tourists
- **Interactive Crisis Map** — Leaflet map with severity-colored pulsing markers, satellite/terrain layers, and event side panel
- **Analytics Dashboard** — 14-day trend charts, severity breakdowns, and CSV export
- **Command Center** — Kanban incident board with AI-generated Situation Reports and resource priority ranking
- **Automated Daily Reports** — GitHub Actions runs every day at 06:00 UTC, commits real data to this repo

---

## 📊 Latest Pipeline Run

<!-- CRISISLENS_STATS_START -->
*First run data will appear here after the first GitHub Actions execution.*
<!-- CRISISLENS_STATS_END -->

---

## 🏗️ Architecture

```
crisislens-webapp/
├── .github/workflows/
│   └── daily_pipeline.yml    ← GitHub Actions: runs every day at 06:00 UTC
├── scripts/
│   └── collect_daily.py      ← Lightweight data collection (no Docker needed)
├── data/
│   ├── daily_report_YYYY-MM-DD.json  ← One file per day, auto-committed
│   └── stats_log.csv                 ← Growing historical dataset
└── webapp/
    ├── backend/              ← FastAPI + PostgreSQL + Gemini AI
    └── frontend/             ← React + Leaflet + Recharts
```

---

## 🛠️ Local Development

**Prerequisites:** Docker Desktop

```bash
# Clone the repo
git clone https://github.com/duleab/crisislens-webapp.git
cd crisislens-webapp/webapp

# Add your API key to .env
echo "GOOGLE_API_KEY=your_key_here" >> .env

# Start everything
docker compose up --build -d

# Open the app
open http://localhost:5173
```

---

## 📡 Data Sources

| Source | Type | Region | Trust |
|--------|------|--------|-------|
| [USGS Earthquake Hazards](https://earthquake.usgs.gov) | Real-time Earthquakes | Global | ⭐ Official |
| [BMKG](https://www.bmkg.go.id) | Earthquakes & Weather | Indonesia | ⭐ Official |
| [GDACS](https://www.gdacs.org) | Multi-hazard Alerts | Global | ⭐ Official |
| [WHO RSS](https://www.who.int) | Disease Outbreaks | Global | ⭐ Official |
| [ReliefWeb](https://reliefweb.int) | Humanitarian Crises | Global | ✅ Verified |

---

## 🤖 Automated Daily Pipeline

This repo uses **GitHub Actions** to run a lightweight data collection script every day — for free, on GitHub's servers. No Docker needed in the cloud.

**What happens every day at 06:00 UTC:**
1. GitHub spins up a free Ubuntu server
2. Installs Python dependencies
3. Fetches crisis events from all 5 sources
4. Saves `data/daily_report_YYYY-MM-DD.json` + updates `data/stats_log.csv`
5. Commits and pushes to this repo
6. GitHub contribution grid gets ✅ 1 green square

**Cost:** ~3 minutes/day × 30 days = 90 min/month ≈ 4.5% of GitHub's free 2,000 min/month quota.

---

## 📁 Daily Data Files

Each day's output is committed to `data/`:

```json
{
  "date": "2026-07-23",
  "total_events": 47,
  "by_source": { "USGS": 31, "BMKG": 1, "GDACS": 8, "WHO": 4, "ReliefWeb": 3 },
  "by_type": { "earthquake": 32, "flood": 6, "disease": 4, "other": 5 },
  "events": [ ... ]
}
```

---

*Built by [Dule_Abera](https://github.com/duleab) · Powered by Google Gemini AI · Data from USGS, BMKG, WHO, GDACS*
