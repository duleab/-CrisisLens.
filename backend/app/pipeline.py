"""
Live ingestion from real public APIs — no mock data.

USGS: https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/{magnitude}_{period}.geojson
BMKG: https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json
GDACS: https://www.gdacs.org/xml/rss.xml  (free, no key — floods/storms/volcanoes/tsunamis)
NewsAPI: https://newsapi.org/v2/everything (optional, requires valid key)
"""
import hashlib
import xml.etree.ElementTree as ET
import httpx
from datetime import datetime, timezone

from app.models import Event
from app.config import settings

USGS_FEED = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson"
BMKG_FEED = "https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json"
GDACS_FEED = "https://www.gdacs.org/xml/rss.xml"


# ─── Confidence formula ────────────────────────────────────────────────────────

def calculate_system_confidence(trust_score: float, ai_confidence: float,
                                 corroboration_count: int, is_official: bool,
                                 has_location: bool) -> float:
    """Exact same 5-factor formula as Cell 8 of the notebook."""
    corroboration_factor = min(1.0, 0.5 + (corroboration_count - 1) * 0.15)
    official_bonus = 0.1 if is_official else 0.0
    geocoding_bonus = 0.05 if has_location else 0.0

    score = (
        0.30 * trust_score +
        0.25 * ai_confidence +
        0.25 * corroboration_factor +
        0.15 * (trust_score + official_bonus) +
        0.05 * (ai_confidence + geocoding_bonus)
    )
    return min(1.0, score)


# ─── NewsAPI helpers ───────────────────────────────────────────────────────────

_TYPE_KEYWORDS = {
    "earthquake": ["earthquake", "quake", "tremor", "seismic", "richter", "magnitude"],
    "flood":      ["flood", "flooding", "inundation", "flash flood", "submerged"],
    "volcano":    ["volcano", "eruption", "volcanic", "lava", "pyroclastic"],
    "wildfire":   ["wildfire", "forest fire", "bushfire", "blaze"],
    "landslide":  ["landslide", "mudslide", "mudflow", "avalanche"],
    "storm":      ["typhoon", "cyclone", "hurricane", "tropical storm", "monsoon"],
    "disease":    ["outbreak", "epidemic", "disease", "virus", "dengue", "covid", "who alert"],
    "tsunami":    ["tsunami", "tidal wave"],
}

_SEA_LOCATIONS = {
    "ID": ["indonesia", "jakarta", "bali", "java", "sumatra", "sulawesi", "lombok", "papua", "kalimantan", "bmkg"],
    "PH": ["philippines", "manila", "mindanao", "luzon", "visayas", "philippine"],
    "TH": ["thailand", "bangkok", "thai"],
    "VN": ["vietnam", "hanoi", "ho chi minh", "vietnamese"],
    "MM": ["myanmar", "burma", "yangon"],
    "MY": ["malaysia", "kuala lumpur", "sabah", "sarawak"],
    "SG": ["singapore"],
    "TL": ["timor-leste", "east timor"],
}

_LOCATION_NAMES = {
    "ID": "Indonesia", "PH": "Philippines", "TH": "Thailand",
    "VN": "Vietnam", "MM": "Myanmar", "MY": "Malaysia",
    "SG": "Singapore", "TL": "Timor-Leste",
}


def _detect_crisis_type(text: str) -> str:
    text_lower = text.lower()
    for crisis_type, keywords in _TYPE_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            return crisis_type
    return "other"


def _detect_severity(text: str) -> str:
    text_lower = text.lower()
    if any(w in text_lower for w in ["deadly", "killed", "deaths", "magnitude 7", "magnitude 8", "catastrophic", "major disaster"]):
        return "critical"
    if any(w in text_lower for w in ["severe", "significant", "major", "magnitude 6", "hundreds", "injured"]):
        return "high"
    if any(w in text_lower for w in ["moderate", "dozens", "damage", "evacuation"]):
        return "medium"
    return "low"


def _detect_country_iso(text: str) -> str | None:
    text_lower = text.lower()
    for iso, keywords in _SEA_LOCATIONS.items():
        if any(kw in text_lower for kw in keywords):
            return iso
    return None


def _detect_location(title: str, description: str) -> str | None:
    text = f"{title} {description or ''}".lower()
    for iso, keywords in _SEA_LOCATIONS.items():
        for kw in keywords:
            if kw in text:
                words = title.split()
                for i, w in enumerate(words):
                    if kw.lower() in w.lower():
                        chunk = " ".join(words[max(0, i-1):i+3])
                        if len(chunk) > 3:
                            return chunk[:60]
                return _LOCATION_NAMES.get(iso, kw.title())
    return None


def _detect_casualties(text: str) -> int | None:
    import re
    text_lower = text.lower()
    patterns = [r"(\d+)\s*(?:people\s+)?(?:killed|dead|deaths)", r"(\d+)\s*(?:people\s+)?injured"]
    for p in patterns:
        m = re.search(p, text_lower)
        if m:
            return int(m.group(1))
    return None


# ─── USGS ──────────────────────────────────────────────────────────────────────

async def fetch_usgs() -> list[dict]:
    events = []
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(USGS_FEED)
            resp.raise_for_status()
            data = resp.json()

        for feature in data.get("features", []):
            props = feature.get("properties", {})
            coords = feature.get("geometry", {}).get("coordinates", [None, None, None])
            lon, lat = coords[0], coords[1]
            mag = props.get("mag")

            events.append({
                "crisis_type": "earthquake",
                "severity": _mag_to_severity(mag),
                "location_name": props.get("place"),
                "country_iso": None,
                "latitude": lat,
                "longitude": lon,
                "magnitude": mag,
                "casualties_estimated": None,
                "event_date": (
                    datetime.fromtimestamp(props["time"] / 1000, tz=timezone.utc).isoformat()
                    if props.get("time") else None
                ),
                "source_names": ["USGS"],
                "official_confirmed": True,
                "trust_score": 1.0,
                "ai_confidence": 1.0,
                "raw_text": props.get("title", ""),
                "source_event_id": f"usgs_{feature.get('id')}",
            })
    except Exception as e:
        print(f"USGS fetch failed: {e}")
    return events


# ─── BMKG ──────────────────────────────────────────────────────────────────────

async def fetch_bmkg() -> list[dict]:
    events = []
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(BMKG_FEED)
            resp.raise_for_status()
            data = resp.json()

        quakes = (
            data.get("Infogempa", {}).get("gempa")
            or data.get("gempa")
            or []
        )
        if isinstance(quakes, dict):
            quakes = [quakes]

        for q in quakes:
            coords = (q.get("point", {}) or {}).get("coordinates", "")
            lat, lon = None, None
            if isinstance(coords, str) and "," in coords:
                try:
                    lon_str, lat_str = coords.split(",")
                    lon, lat = float(lon_str), float(lat_str)
                except ValueError:
                    pass

            mag = None
            try:
                mag = float(q.get("Magnitude", "").strip())
            except (ValueError, AttributeError):
                pass

            events.append({
                "crisis_type": "earthquake",
                "severity": _mag_to_severity(mag),
                "location_name": q.get("Wilayah"),
                "country_iso": "ID",
                "latitude": lat,
                "longitude": lon,
                "magnitude": mag,
                "casualties_estimated": None,
                "event_date": q.get("DateTime"),
                "source_names": ["BMKG"],
                "official_confirmed": True,
                "trust_score": 1.0,
                "ai_confidence": 1.0,
                "raw_text": f"{q.get('Wilayah', '')} — {q.get('Potensi', '')}",
                "source_event_id": f"bmkg_{q.get('DateTime')}_{q.get('Wilayah')}",
            })
    except Exception as e:
        print(f"BMKG fetch failed: {e}")
    return events


# ─── GDACS ─────────────────────────────────────────────────────────────────────

_GDACS_NS = "http://www.gdacs.org"
_GDACS_TYPE_MAP = {
    "EQ": "earthquake", "TC": "storm", "FL": "flood",
    "VO": "volcano", "TS": "tsunami", "WF": "wildfire",
    "LS": "landslide", "DR": "other",
}
_GDACS_SEV_MAP = {
    "Red": "critical", "Orange": "high", "Yellow": "medium", "Green": "low",
}
_GDACS_COUNTRY_ISO: dict[str, str] = {
    "Indonesia": "ID", "Philippines": "PH", "Thailand": "TH",
    "Vietnam": "VN", "Myanmar": "MM", "Malaysia": "MY",
    "Singapore": "SG", "Timor-Leste": "TL", "Papua New Guinea": "PG",
    "Bangladesh": "BD", "India": "IN", "Pakistan": "PK",
}


async def fetch_gdacs() -> list[dict]:
    """Fetch global disaster alerts from GDACS RSS (free, no key required).
    Covers: floods, tropical cyclones, volcanoes, tsunamis, wildfires, landslides."""
    events = []
    try:
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
            resp = await client.get(GDACS_FEED)
            resp.raise_for_status()

        root = ET.fromstring(resp.text)
        channel = root.find("channel")
        items = channel.findall("item") if channel is not None else []

        for item in items[:40]:
            title = item.findtext("title", "") or ""
            desc = item.findtext("description", "") or ""
            pub_date = item.findtext("pubDate", "") or ""

            # GDACS namespace elements
            ns = _GDACS_NS
            event_type = item.findtext(f"{{{ns}}}eventtype", "other") or "other"
            alert_level = item.findtext(f"{{{ns}}}alertlevel", "Green") or "Green"
            country_name = item.findtext(f"{{{ns}}}country", "") or ""
            severity_val = item.findtext(f"{{{ns}}}severity", "") or ""

            # Coordinates
            lat_el = item.find(f"{{{ns}}}lat")
            lon_el = item.find(f"{{{ns}}}long")
            lat = float(lat_el.text) if lat_el is not None and lat_el.text else None
            lon = float(lon_el.text) if lon_el is not None and lon_el.text else None

            crisis_type = _GDACS_TYPE_MAP.get(event_type.upper(), "other")
            if crisis_type == "other":
                continue  # Skip unclassified

            severity = _GDACS_SEV_MAP.get(alert_level.capitalize(), "low")
            country_iso = _GDACS_COUNTRY_ISO.get(country_name)

            uid = hashlib.md5(f"{title}{pub_date}".encode()).hexdigest()[:12]

            events.append({
                "crisis_type": crisis_type,
                "severity": severity,
                "location_name": country_name or None,
                "country_iso": country_iso,
                "latitude": lat,
                "longitude": lon,
                "magnitude": None,
                "casualties_estimated": None,
                "event_date": pub_date or None,
                "source_names": ["GDACS"],
                "official_confirmed": True,  # GDACS is an official UN-affiliated system
                "trust_score": 0.92,
                "ai_confidence": 0.90,
                "raw_text": f"{title} — {desc}"[:500],
                "source_event_id": f"gdacs_{uid}",
            })
    except Exception as e:
        print(f"GDACS fetch failed: {e}")
    return events


# ─── NewsAPI ───────────────────────────────────────────────────────────────────

async def fetch_newsapi() -> list[dict]:
    """Fetch disaster/crisis news for SE Asia from NewsAPI."""
    events = []
    key = settings.newsapi_key
    if not key:
        print("NewsAPI: no key configured, skipping")
        return events

    query = (
        "(earthquake OR flood OR volcano OR wildfire OR landslide OR typhoon OR disaster OR tsunami) "
        "AND (Indonesia OR Philippines OR Thailand OR Vietnam OR Myanmar OR Malaysia OR Bali)"
    )
    url = (
        "https://newsapi.org/v2/everything"
        f"?q={query}&language=en&sortBy=publishedAt&pageSize=30&apiKey={key}"
    )

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()

        for article in data.get("articles", []):
            title = article.get("title") or ""
            description = article.get("description") or ""
            combined = f"{title} {description}"
            combined_lower = combined.lower()

            if not any(
                kw in combined_lower
                for kw in ["indonesia", "philippine", "thailand", "vietnam", "myanmar", "malaysia", "bali", "java", "sumatra"]
            ):
                continue

            crisis_type = _detect_crisis_type(combined_lower)
            if crisis_type == "other":
                continue

            severity = _detect_severity(combined_lower)
            location = _detect_location(title, description)
            country_iso = _detect_country_iso(combined_lower)
            casualties = _detect_casualties(combined_lower)

            url_str = article.get("url", title)
            uid = hashlib.md5(url_str.encode()).hexdigest()[:12]

            events.append({
                "crisis_type": crisis_type,
                "severity": severity,
                "location_name": location or (country_iso and _LOCATION_NAMES.get(country_iso)),
                "country_iso": country_iso,
                "latitude": None,
                "longitude": None,
                "magnitude": None,
                "casualties_estimated": casualties,
                "event_date": article.get("publishedAt"),
                "source_names": [article.get("source", {}).get("name", "NewsAPI")],
                "official_confirmed": False,
                "trust_score": 0.65,
                "ai_confidence": 0.70,
                "raw_text": combined[:500],
                "source_event_id": f"news_{uid}",
            })
    except Exception as e:
        print(f"NewsAPI fetch failed: {e}")
    return events


# ─── Helpers ───────────────────────────────────────────────────────────────────

def _mag_to_severity(mag: float | None) -> str:
    if mag is None:
        return "low"
    if mag >= 6.5:
        return "critical"
    if mag >= 5.5:
        return "high"
    if mag >= 4.0:
        return "medium"
    return "low"


def to_event_row(raw: dict) -> Event:
    confidence = calculate_system_confidence(
        trust_score=raw.get("trust_score", 0.5),
        ai_confidence=raw.get("ai_confidence", 0.5),
        corroboration_count=1,
        is_official=raw.get("official_confirmed", False),
        has_location=raw.get("latitude") is not None,
    )
    return Event(
        crisis_type=raw["crisis_type"],
        severity=raw["severity"],
        system_confidence=confidence,
        trust_score=raw.get("trust_score", 0.5),
        location_name=raw.get("location_name"),
        country_iso=raw.get("country_iso"),
        latitude=raw.get("latitude"),
        longitude=raw.get("longitude"),
        magnitude=raw.get("magnitude"),
        casualties_estimated=raw.get("casualties_estimated"),
        event_date=raw.get("event_date"),
        source_names=raw.get("source_names", []),
        official_confirmed=raw.get("official_confirmed", False),
        corroboration_count=1,
        raw_text=raw.get("raw_text"),
        source_event_id=raw.get("source_event_id"),
    )
