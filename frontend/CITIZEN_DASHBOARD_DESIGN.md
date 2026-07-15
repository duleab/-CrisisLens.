# 🚨 CrisisLens Dashboard Design Specifications
## Complete UI/UX Design for All Four Roles

---

# 👥 Citizen Dashboard Design Specification

## 🎯 User Profile Setup
```
┌─────────────────────────────────────────────────────────────┐
│ Welcome to CrisisLens                                       │
│                                                             │
│ Your Name: [Dule Abera]                                    │
│ Location: [📍 Auto-detected: Sukabumi, West Java]          │
│ Phone: [+62 XXX XXXX XXXX]                                │
│ Emergency Contact: [Select: Family/Friend]                 │
│ Language: [🇮🇩 Bahasa | 🇺🇸 English]                       │
│                                                             │
│ [✓] Allow GPS Location                                      │
│ [✓] Enable Push Notifications                              │
│ [✓] Emergency SMS Alerts                                   │
│                                                             │
│               [Continue to Dashboard]                       │
└─────────────────────────────────────────────────────────────┘
```

## 📱 Main Citizen Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│ CrisisLens - Citizen                    🟢 LIVE ● 10:45:32  │
│                                         Next refresh: 0:47   │
├─────────────────────────────────────────────────────────────┤
│ 👋 Hello, Dule Abera                                       │
│ 📍 Sukabumi, West Java                 🔄 Auto-refresh: 60s │
├─────────────────────────────────────────────────────────────┤
│ ⚠️  ALERT LEVEL                                             │
│ 🟠 MODERATE FLOOD RISK                                      │
│ Heavy rain expected in next 2 hours                        │
│ Last updated: 2 minutes ago                                │
├─────────────────────────────────────────────────────────────┤
│ 🌤️  WEATHER RIGHT NOW                                       │
│ ┌─────────┬─────────┬─────────┬─────────────────────────────┐ │
│ │ 28°C    │ 🌧️      │ 85%     │ Next 3 hours:              │ │
│ │ Temp    │ Heavy   │ Humid   │ Heavy rain continues        │ │
│ │         │ Rain    │         │ Wind: 18 km/h               │ │
│ └─────────┴─────────┴─────────┴─────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 🚨 NEARBY INCIDENTS (Within 10km)                          │
│ ┌─────────┬────────────────────────────┬──────────────────┐ │
│ │ 🌊      │ Flood Warning              │ 2.1 km away     │ │
│ │ HIGH    │ Ciliwung River             │ 📍 View on Map  │ │
│ ├─────────┼────────────────────────────┼──────────────────┤ │
│ │ 🚫      │ Road Closure               │ 3.4 km away     │ │
│ │ MED     │ Jalan Raya Bogor          │ 🗺️ Safe Routes  │ │
│ ├─────────┼────────────────────────────┼──────────────────┤ │
│ │ ⛰️      │ Landslide Risk             │ 7.8 km away     │ │
│ │ LOW     │ Gunung Salak area          │ ⚠️ Monitor      │ │
│ └─────────┴────────────────────────────┴──────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 🏥 EMERGENCY RESOURCES NEAR YOU                            │
│ ┌─────────────────┬─────────────────┬─────────────────────┐ │
│ │ 🏠 Shelter      │ 🏥 Hospital     │ 🚔 Police          │ │
│ │ GOR Sukabumi    │ RS Sekarwangi   │ Polres Sukabumi    │ │
│ │ 1.8 km away     │ 2.3 km away     │ 1.1 km away        │ │
│ │ 📍 Capacity:    │ 🚑 Emergency:   │ 📞 Call: 110       │ │
│ │ Available       │ Open            │                     │ │
│ └─────────────────┴─────────────────┴─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 🤖 AI SAFETY ASSISTANT                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 💡 RECOMMENDATION FOR YOU:                              │ │
│ │                                                         │ │
│ │ "Heavy rain is expected in Sukabumi for the next        │ │
│ │ 4 hours. Avoid crossing Ciliwung River area.           │ │
│ │ Your nearest shelter has available space. Stay         │ │
│ │ indoors and prepare emergency supplies."                │ │
│ │                                                         │ │
│ │ Confidence: 87% | Sources: BMKG, Local Reports         │ │
│ │                                                         │ │
│ │ Ask me: "Should I evacuate?" or "Is it safe to drive?" │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 🚨 QUICK EMERGENCY ACTIONS                                 │
│ ┌─────────────┬─────────────┬─────────────┬─────────────────┐ │
│ │ 🗺️ Find     │ 🏠 Nearest  │ 📞 Emergency │ 📱 Report       │ │
│ │ Safe Route  │ Shelter     │ Contacts     │ Incident        │ │
│ └─────────────┴─────────────┴─────────────┴─────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🏠 Home | 🗺️ Map | 🤖 AI Chat | 🔔 Alerts | 👤 Profile      │
└─────────────────────────────────────────────────────────────┘
```

## 🗺️ Citizen Map View
```
┌─────────────────────────────────────────────────────────────┐
│ Live Crisis Map - Your Area              🔄 Updates: 30s    │
├─────────────────────────────────────────────────────────────┤
│ Layers: ☑️Floods ☑️Roads ☑️Shelters ☑️Hospitals ☑️Weather   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│        🗺️ SUKABUMI DISTRICT MAP                             │
│                                                             │
│    🏠 You are here ← 📍                                    │
│                                                             │
│         🌊 Flood (2km) ⚠️                                   │
│                                                             │
│    🏥 Hospital (2.3km) 🚑                                  │
│                                                             │
│    🏠 Shelter (1.8km) 🛡️                                   │
│                                                             │
│         🚫 Road Closed (3km) ❌                             │
│                                                             │
│    🚔 Police Station (1.1km) 👮                            │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Tap any marker for details                              │ │
│ │ 🧭 Navigate to safe locations                           │ │
│ │ 📱 Share your location with family                      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 💬 AI Chat Interface
```
┌─────────────────────────────────────────────────────────────┐
│ AI Safety Assistant                     🤖 Powered by Gemma │
├─────────────────────────────────────────────────────────────┤
│ 👤 You: "Should I evacuate my area?"                       │
│                                                             │
│ 🤖 AI: "Based on current data for Sukabumi:                │
│                                                             │
│ ✅ EVACUATION NOT REQUIRED                                  │
│                                                             │
│ • Flood risk is MODERATE (not critical)                    │
│ • Your location is 2.1km from flood zone                   │
│ • Local shelter available if needed                        │
│                                                             │
│ RECOMMENDATIONS:                                            │
│ 🏠 Stay indoors during heavy rain                          │
│ 📦 Prepare emergency supplies (food, water, flashlight)    │
│ 📱 Keep phone charged                                       │
│ 🚗 Avoid driving near Ciliwung River                       │
│                                                             │
│ Confidence: 91% | Updated: 3 min ago"                      │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Ask me anything: [Type your question...]               │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Quick questions:                                            │
│ • "Is it safe to drive?"                                   │
│ • "Where is the nearest hospital?"                         │
│ • "What supplies do I need?"                               │
└─────────────────────────────────────────────────────────────┘
```