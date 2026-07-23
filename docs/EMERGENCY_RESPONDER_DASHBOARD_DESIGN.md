# 🚑 Emergency Responder Dashboard Design Specification

## 🎯 User Profile Setup
```
┌─────────────────────────────────────────────────────────────┐
│ CrisisLens - Emergency Response Portal                     │
│                                                             │
│ Responder Name: [Captain Sarah Wijaya]                     │
│ Unit: [Fire & Rescue Sukabumi District]                    │
│ Position: [Operations Commander]                            │
│ Badge ID: [FR-2134-SBM]                                    │
│ Certification: [Level III Emergency Response]              │
│ Operational Area: [📍 Sukabumi District, West Java]       │
│ Contact: [+62 XXX XXXX XXXX]                              │
│ Emergency Radio: [Channel 7 - Frequency 461.250]          │
│                                                             │
│ Status: 🟢 ON-DUTY                                         │
│                                                             │
│               [Access Operations Center]                    │
└─────────────────────────────────────────────────────────────┘
```

## 🚨 Main Operations Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│ 🚑 Emergency Operations Center          🔴 ACTIVE RESPONSE  │
│ Capt. Sarah Wijaya | Sukabumi District  🔄 Updates: 30s     │
├─────────────────────────────────────────────────────────────┤
│ ⚠️ OPERATIONAL STATUS - SUKABUMI DISTRICT                   │
│ 🔴 LEVEL 3 EMERGENCY - FLOOD RESPONSE ACTIVE               │
│ Incident Commander: Col. Ahmad Rahman | Started: 08:15      │
├─────────────────────────────────────────────────────────────┤
│ 🎯 PRIORITY MISSIONS                                        │
│ ┌─────┬────────────────────────────┬─────────────────────┐ │
│ │ 🔴  │ 🏠 House Evacuation        │ 📍 Jl. Merdeka 45   │ │
│ │CRIT │ Family trapped on roof     │ ETA: 12 minutes     │ │
│ │     │ 👥 4 people + elderly      │ 🚁 Heli requested   │ │
│ ├─────┼────────────────────────────┼─────────────────────┤ │
│ │ 🟠  │ 🌊 River Rescue           │ 📍 Ciliwung Bridge  │ │
│ │HIGH │ Person in flood waters     │ ETA: 8 minutes      │ │
│ │     │ 👤 Male, 30s, conscious    │ 🛟 Boat Team Alpha  │ │
│ ├─────┼────────────────────────────┼─────────────────────┤ │
│ │ 🟡  │ 🏥 Medical Transport      │ 📍 Shelter Point B  │ │
│ │MED  │ Elderly cardiac symptoms   │ ETA: 15 minutes     │ │
│ │     │ 👵 Female, 73, stable     │ 🚑 Ambulance Unit 3 │ │
│ └─────┴────────────────────────────┴─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 🗺️ LIVE OPERATIONAL MAP                                    │
│                                                             │
│     🚨 You are here ← [Command Center]                     │
│                                                             │
│     🔴 CRITICAL: House (2.1km NW) ⬆️                      │
│     🚁 Heli landing zone ⚫                                │
│                                                             │
│     🟠 HIGH: Bridge rescue (1.8km E) ➡️                   │ 
│     🛟 Boat Team Alpha approaching                         │
│                                                             │
│     🟡 MED: Shelter transport (0.5km S) ⬇️                │
│     🚑 Ambulance Unit 3 dispatched                        │
│                                                             │
│     🏥 Hospital (3.2km) 🏠 Shelters (multiple)            │
│     🚔 Police checkpoint 🛑 Road closures                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 📊 RESOURCE STATUS                                          │
│ ┌─────────────────┬─────────────────┬─────────────────────┐ │
│ │ 🚑 Emergency    │ 🛟 Water Rescue │ 🚁 Air Support     │ │
│ │ Medical Units   │ Equipment       │ Helicopters        │ │
│ │ ✅ Available: 3 │ ✅ Boats: 4/6   │ ✅ Ready: 1/1      │ │
│ │ 🔄 Deployed: 8  │ 🔄 Active: 2    │ 🔄 Inbound: 0      │ │
│ │ 🔧 Maintenance:1│ 🔧 Repair: 0    │ 🔧 Maintenance: 0  │ │
│ └─────────────────┴─────────────────┴─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 👥 TEAM STATUS & COMMUNICATION                             │
│ ┌─────────────┬─────────────┬─────────────┬─────────────────┐ │
│ │ 🟢 Alpha    │ 🟢 Bravo    │ 🟡 Charlie  │ 📻 Radio Check  │ │
│ │ Water Rescue│ Medical     │ Search &    │ All units       │ │
│ │ 4 members   │ 6 members   │ Rescue      │ Channel 7       │ │
│ │ On mission  │ Standby     │ 3 members   │ Last: 10:42:15  │ │
│ │            │             │ Returning   │                 │ │
│ └─────────────┴─────────────┴─────────────┴─────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🚨 Dispatch | 🗺️ Ops Map | 🤖 AI Support | 📊 Status      │
└─────────────────────────────────────────────────────────────┘
```
## 📱 Mobile Dispatch Interface
```
┌─────────────────────────────────────────────────────────────┐
│ 📱 MOBILE RESPONSE UNIT                                     │
│ Team Alpha | Water Rescue      🔴 ACTIVE MISSION           │
├─────────────────────────────────────────────────────────────┤
│ 🎯 CURRENT MISSION: Bridge Rescue                          │
│ 📍 Location: Ciliwung Bridge (1.8km E)                    │
│ ⏱️ Mission Time: 00:18:32                                  │
│ 🚨 Priority: HIGH                                          │
├─────────────────────────────────────────────────────────────┤
│ 👤 TARGET DETAILS                                          │
│ • Male, approximately 30 years old                        │
│ • Conscious and responsive                                 │
│ • Clinging to bridge pillar                              │
│ • Water level: 2.5 meters, current: moderate              │
│ • Visibility: Good, daylight conditions                   │
├─────────────────────────────────────────────────────────────┤
│ 🛟 EQUIPMENT CHECKLIST                                     │
│ ✅ Life jackets (4x)         ✅ Rescue rope (50m)         │
│ ✅ Throwbag                  ✅ First aid kit             │
│ ✅ Communication radio       ✅ Emergency flares          │
│ ✅ Boat (inflatable)        ✅ Backup radio              │
├─────────────────────────────────────────────────────────────┤
│ 📞 QUICK COMMUNICATION                                     │
│ ┌─────────────┬─────────────┬─────────────┬─────────────────┐ │
│ │ 📻 Command  │ 🚑 Medical  │ 🚔 Police   │ 🔄 Status      │ │
│ │ Center      │ Standby     │ Traffic     │ Update         │ │
│ │ [CONNECT]   │ [CONNECT]   │ [CONNECT]   │ [SEND]         │ │
│ └─────────────┴─────────────┴─────────────┴─────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 🎯 AI RESCUE ASSISTANT GUIDANCE                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🤖 RESCUE STRATEGY RECOMMENDATION:                      │ │
│ │                                                         │ │
│ │ APPROACH:                                               │ │
│ │ • Deploy from upstream side (safer current)            │ │
│ │ • Use throw bag first - target is conscious            │ │
│ │ • Backup boat ready if needed                          │ │
│ │                                                         │ │
│ │ SAFETY PRIORITIES:                                      │ │
│ │ 1. Team safety first - current is moderate             │ │
│ │ 2. Target is stable - no immediate drowning risk       │ │
│ │ 3. Multiple witnesses confirm target identity          │ │
│ │                                                         │ │
│ │ ESTIMATED COMPLETION: 12-15 minutes                    │ │
│ │ RISK LEVEL: MODERATE                                   │ │
│ │                                                         │ │
│ │ Confidence: 89% | Weather: Favorable                   │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ ⚡ EMERGENCY ACTIONS                                       │
│ ┌─────────────┬─────────────┬─────────────┬─────────────────┐ │
│ │ 🆘 EMERGENCY│ 📍 LOCATION │ 📞 BACKUP   │ 🚁 HELICOPTER  │ │
│ │ EVACUATION  │ GPS SHARE   │ REQUEST     │ REQUEST        │ │
│ │ [ACTIVATE]  │ [SEND NOW]  │ [CALL]      │ [URGENT]       │ │
│ └─────────────┴─────────────┴─────────────┴─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📊 District Operations Overview
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 SUKABUMI DISTRICT OPERATIONS OVERVIEW                   │
├─────────────────────────────────────────────────────────────┤
│ 📈 INCIDENT STATISTICS - LAST 24 HOURS                    │
│ ┌─────────────┬─────────────┬─────────────┬─────────────────┐ │
│ │ 🚨 Total    │ ✅ Resolved │ 🔄 Active   │ 👥 People      │ │
│ │ Incidents   │ Incidents   │ Incidents   │ Rescued        │ │
│ │     23      │     18      │      5      │      67        │ │
│ └─────────────┴─────────────┴─────────────┴─────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 🎯 RESOURCE DEPLOYMENT MAP                                  │ │
│                                                             │
│     SUKABUMI DISTRICT ZONES                                │
│     ┌─────────┬─────────┬─────────┬─────────┐              │
│     │ NORTH   │ EAST    │ SOUTH   │ WEST    │              │
│     │ 🟢 Clear│ 🔴 Flood│ 🟢 Clear│ 🟡 Watch│              │
│     │ 2 teams │ 8 teams │ 1 team  │ 3 teams │              │
│     └─────────┴─────────┴─────────┴─────────┘              │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🚨 ACTIVE INCIDENT LOCATIONS:                           │ │
│ │ • Ciliwung River area (East Zone) - 5 teams            │ │
│ │ • Residential area (East Zone) - 3 teams               │ │
│ │ • Bridge sector (East Zone) - 2 teams                  │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 👥 PERSONNEL STATUS                                         │
│ ┌─────────────────┬─────────────────┬─────────────────────┐ │
│ │ 🚑 On Duty      │ 🔄 Deployed     │ 💤 Rest/Recovery    │ │
│ │ 45 personnel    │ 32 personnel    │ 8 personnel         │ │
│ │ Ready for       │ Active missions │ Mandatory rest      │ │
│ │ deployment      │ & operations    │ after 12hrs duty    │ │
│ └─────────────────┴─────────────────┴─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🤖 Emergency Response AI Assistant
```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 Emergency Response AI Assistant                         │
├─────────────────────────────────────────────────────────────┤
│ 👤 Responder: "Should we request helicopter for rooftop   │
│               evacuation?"                                  │
│                                                             │
│ 🤖 AI: "HELICOPTER ASSESSMENT for Jl. Merdeka 45:          │
│                                                             │
│ ✅ HELICOPTER RECOMMENDED                                   │
│                                                             │
│ JUSTIFICATION:                                              │
│ • 4 people including elderly person on roof                │
│ • Rising water level (2.3m and increasing)                 │
│ • Ground access blocked by flooding                        │
│ • Weather conditions: Favorable for flight                 │
│ • Landing zone available nearby (school field)             │
│                                                             │
│ OPERATION DETAILS:                                          │
│ • Estimated flight time: 8 minutes                         │
│ • Landing zone prep: 5 minutes                             │
│ • Evacuation time: 10 minutes                              │
│ • Total operation: ~25 minutes                             │
│                                                             │
│ SAFETY FACTORS:                                             │
│ ✅ Clear flight path                                        │
│ ✅ Adequate landing space                                   │ 
│ ✅ Ground team ready for coordination                       │
│ ✅ Medical team on standby                                  │
│                                                             │
│ RECOMMENDATION: Request helicopter immediately.             │
│ Ground evacuation risk too high."                          │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Ask tactical questions: [Type here...]                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Sample questions:                                           │
│ • "Best route to reach flood zone?"                        │
│ • "Which team should handle medical emergency?"            │
│ • "How many boats needed for evacuation?"                 │
│ • "Risk assessment for night operations?"                 │
└─────────────────────────────────────────────────────────────┘
```

## 📋 After-Action Report Interface
```
┌─────────────────────────────────────────────────────────────┐
│ 📋 MISSION COMPLETION REPORT                               │
├─────────────────────────────────────────────────────────────┤
│ ✅ MISSION: Bridge Rescue - COMPLETED                      │
│ 📍 Location: Ciliwung Bridge                              │
│ ⏱️ Duration: 00:23:45                                      │
│ 👤 Rescued: 1 male, age ~30                               │
│ 🏥 Medical: Minor hypothermia, stable condition           │
├─────────────────────────────────────────────────────────────┤
│ 👥 TEAM PERFORMANCE                                         │
│ • Team Alpha (Water Rescue): Excellent                    │
│ • Response time: 18 minutes (within standard)             │
│ • Safety protocols: All followed                          │
│ • Equipment: All operational and accounted for            │ │
│ • Communication: Clear throughout operation                │
├─────────────────────────────────────────────────────────────┤
│ 📝 AUTOMATED INCIDENT REPORT                               │
│ [📧 Send to Command] [📋 Official Report] [📊 Statistics]  │
└─────────────────────────────────────────────────────────────┘
```