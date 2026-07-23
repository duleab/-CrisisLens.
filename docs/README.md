# 📚 CrisisLens — Technical Documentation

This folder contains detailed design specifications for each role-based dashboard.

## Documents

| File | Description |
|------|-------------|
| [DASHBOARD_DESIGNS_OVERVIEW.md](DASHBOARD_DESIGNS_OVERVIEW.md) | High-level overview of all dashboard designs |
| [CITIZEN_DASHBOARD_DESIGN.md](CITIZEN_DASHBOARD_DESIGN.md) | Citizen safety dashboard — UI/UX specifications |
| [TOURIST_DASHBOARD_DESIGN.md](TOURIST_DASHBOARD_DESIGN.md) | Tourist travel safety dashboard — UI/UX specifications |
| [EMERGENCY_RESPONDER_DASHBOARD_DESIGN.md](EMERGENCY_RESPONDER_DASHBOARD_DESIGN.md) | Emergency responder operational dashboard |
| [GOVERNMENT_DASHBOARD_DESIGN.md](GOVERNMENT_DASHBOARD_DESIGN.md) | Government strategic command dashboard |

## Architecture Notes

Each dashboard is implemented as a role-specific React page under `frontend/src/pages/`.
The AI chat component (`ChatWidget.tsx`) adapts its Gemma AI prompt context based on the active role.

See the [main README](../README.md) for the full system architecture.
