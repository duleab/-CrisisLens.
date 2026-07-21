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
EONET_FEED = "https://eonet.gsfc.nasa.gov/api/v3/events?status=open"
WHO_FEED = "https://www.who.int/rss-feeds/news-english.xml"
UN_FEED = "https://news.un.org/feed/subscribe/en/news/region/asia-pacific/feed/rss.xml"


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


# ─── NASA EONET ────────────────────────────────────────────────────────────────

_EONET_TYPE_MAP = {
    "wildfires": "wildfire",
    "volcanoes": "volcano",
    "severeStorms": "storm",
    "floods": "flood",
    "landslides": "landslide",
    "seaLakeIce": "other",
    "earthquakes": "earthquake",
    "drought": "other",
    "dustAndHaze": "other",
    "tempExtremes": "other",
    "waterColor": "other",
}

async def fetch_eonet() -> list[dict]:
    """Fetches open disaster events from NASA EONET v3 API."""
    events = []
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(EONET_FEED)
            if resp.status_code != 200:
                print(f"EONET status code: {resp.status_code}")
                return events
            data = resp.json()

        for item in data.get("events", []):
            eid = item.get("id")
            title = item.get("title", "NASA EONET Event")
            categories = item.get("categories", [])
            cat_id = categories[0].get("id") if categories else "other"
            crisis_type = _EONET_TYPE_MAP.get(cat_id, "other")

            # Get latest geometry coordinate if available
            geometries = item.get("geometry", [])
            if not geometries:
                continue
            latest_geo = geometries[-1]
            coords = latest_geo.get("coordinates")
            event_date = latest_geo.get("date")

            lat = None
            lon = None
            if isinstance(coords, list) and len(coords) >= 2:
                # EONET Point geometry coordinates are [longitude, latitude]
                try:
                    lon = float(coords[0])
                    lat = float(coords[1])
                except (ValueError, TypeError):
                    pass

            if lat is None or lon is None:
                continue

            country_iso = _detect_country_iso(title)
            severity = "high" if crisis_type in ("wildfire", "volcano", "storm", "earthquake") else "medium"

            events.append({
                "crisis_type": crisis_type,
                "severity": severity,
                "location_name": title,
                "country_iso": country_iso,
                "latitude": lat,
                "longitude": lon,
                "magnitude": None,
                "casualties_estimated": None,
                "event_date": event_date,
                "source_names": ["NASA EONET"],
                "official_confirmed": True,
                "trust_score": 0.95,
                "ai_confidence": 0.90,
                "raw_text": f"NASA EONET Event: {title} ({cat_id})"[:500],
                "source_event_id": f"eonet_{eid}",
            })
    except Exception as e:
        print(f"EONET fetch failed: {e}")
    return events


# ─── Open-Meteo ────────────────────────────────────────────────────────────────

_SEA_CITIES_METEO = [
    {"name": "Jakarta, Indonesia", "iso": "ID", "lat": -6.2088, "lon": 106.8456},
    {"name": "Denpasar (Bali), Indonesia", "iso": "ID", "lat": -8.6705, "lon": 115.2126},
    {"name": "Surabaya, Indonesia", "iso": "ID", "lat": -7.2575, "lon": 112.7521},
    {"name": "Medan, Indonesia", "iso": "ID", "lat": 3.5952, "lon": 98.6722},
    {"name": "Makassar, Indonesia", "iso": "ID", "lat": -5.1477, "lon": 119.4327},
    {"name": "Manila, Philippines", "iso": "PH", "lat": 14.5995, "lon": 120.9842},
    {"name": "Bangkok, Thailand", "iso": "TH", "lat": 13.7563, "lon": 100.5018},
    {"name": "Ho Chi Minh City, Vietnam", "iso": "VN", "lat": 10.8231, "lon": 106.6297},
    {"name": "Kuala Lumpur, Malaysia", "iso": "MY", "lat": 3.1390, "lon": 101.6869},
    {"name": "Yangon, Myanmar", "iso": "MM", "lat": 16.8409, "lon": 96.1735},
]

async def fetch_open_meteo() -> list[dict]:
    """Fetches weather alerts/risks across key SE Asia locations using Open-Meteo daily forecast."""
    events = []
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            for city in _SEA_CITIES_METEO:
                url = (
                    f"https://api.open-meteo.com/v1/forecast"
                    f"?latitude={city['lat']}&longitude={city['lon']}"
                    f"&daily=temperature_2m_max,precipitation_sum&timezone=auto&forecast_days=2"
                )
                try:
                    resp = await client.get(url)
                    if resp.status_code != 200:
                        continue
                    data = resp.json()
                    daily = data.get("daily", {})
                    dates = daily.get("time", [])
                    precips = daily.get("precipitation_sum", [])
                    temps = daily.get("temperature_2m_max", [])

                    for i in range(len(dates)):
                        date_str = dates[i]
                        precip = precips[i] if i < len(precips) and precips[i] is not None else 0.0
                        temp = temps[i] if i < len(temps) and temps[i] is not None else 0.0

                        crisis_type = None
                        severity = "low"
                        title = ""
                        if precip > 80.0:
                            crisis_type = "flood"
                            severity = "high"
                            title = f"Extreme Rainfall & Flood Alert ({precip} mm/day)"
                        elif precip > 50.0:
                            crisis_type = "flood"
                            severity = "medium"
                            title = f"Heavy Rain & Flood Advisory ({precip} mm/day)"
                        elif temp > 40.0:
                            crisis_type = "wildfire"
                            severity = "high"
                            title = f"Extreme Heatwave Alert ({temp}°C)"
                        elif temp > 38.0:
                            crisis_type = "wildfire"
                            severity = "medium"
                            title = f"High Temperature & Heat Advisory ({temp}°C)"

                        if crisis_type:
                            uid = hashlib.md5(f"{city['name']}_{date_str}_{crisis_type}".encode()).hexdigest()[:12]
                            events.append({
                                "crisis_type": crisis_type,
                                "severity": severity,
                                "location_name": city["name"],
                                "country_iso": city["iso"],
                                "latitude": city["lat"],
                                "longitude": city["lon"],
                                "magnitude": None,
                                "casualties_estimated": None,
                                "event_date": f"{date_str}T12:00:00Z",
                                "source_names": ["Open-Meteo"],
                                "official_confirmed": True,
                                "trust_score": 0.90,
                                "ai_confidence": 0.85,
                                "raw_text": f"Open-Meteo Weather Advisory for {city['name']} on {date_str}: {title}. Precip: {precip}mm, Max Temp: {temp}°C."[:500],
                                "source_event_id": f"meteo_{uid}",
                            })
                except Exception:
                    continue
    except Exception as e:
        print(f"Open-Meteo fetch failed: {e}")
    return events


# ─── WHO / UN humanitarian RSS feeds ───────────────────────────────────────────

_COUNTRY_CENTERS = {
    "ID": (-0.7893, 113.9213),
    "PH": (12.8797, 121.7740),
    "TH": (15.8700, 100.9925),
    "VN": (14.0583, 108.2772),
    "MM": (21.9162, 95.9560),
    "MY": (4.2105, 101.9758),
    "SG": (1.3521, 103.8198),
    "TL": (-8.8742, 125.7275),
    "PG": (-6.3149, 143.9555),
    "BD": (23.6850, 90.3563),
    "IN": (20.5937, 78.9629),
    "PK": (30.3753, 69.3451),
}


async def fetch_who_rss() -> list[dict]:
    """Fetches health emergencies and humanitarian news from WHO and UN Asia-Pacific RSS feeds."""
    events = []
    feeds = [("WHO", WHO_FEED), ("UN News", UN_FEED)]
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            for source_label, feed_url in feeds:
                try:
                    resp = await client.get(feed_url)
                    if resp.status_code != 200:
                        continue
                    root = ET.fromstring(resp.text)
                    for item in root.findall(".//item"):
                        title_el = item.find("title")
                        desc_el = item.find("description")
                        pub_el = item.find("pubDate")
                        link_el = item.find("link")

                        title = title_el.text.strip() if title_el is not None and title_el.text else ""
                        desc = desc_el.text.strip() if desc_el is not None and desc_el.text else ""
                        pub_date = pub_el.text.strip() if pub_el is not None and pub_el.text else None
                        link = link_el.text.strip() if link_el is not None and link_el.text else title

                        combined = f"{title} {desc}"
                        crisis_type = _detect_crisis_type(combined)
                        if source_label == "WHO" and crisis_type == "other":
                            if any(kw in combined.lower() for kw in ["health", "emergency", "alert", "cholera", "mpox", "dengue", "malaria", "avian"]):
                                crisis_type = "disease"

                        if crisis_type not in ("disease", "flood", "earthquake", "volcano", "storm", "wildfire", "landslide", "tsunami"):
                            if not any(kw in combined.lower() for kw in ["crisis", "emergency", "disaster", "humanitarian", "evacuation"]):
                                continue
                            crisis_type = "other"

                        country_iso = _detect_country_iso(combined)
                        location = _detect_location(title, desc)
                        severity = _detect_severity(combined)
                        
                        lat, lon = None, None
                        if country_iso and country_iso in _COUNTRY_CENTERS:
                            lat, lon = _COUNTRY_CENTERS[country_iso]

                        uid = hashlib.md5(link.encode()).hexdigest()[:12]
                        events.append({
                            "crisis_type": crisis_type,
                            "severity": severity,
                            "location_name": location or (country_iso and _LOCATION_NAMES.get(country_iso)) or f"{source_label} Report",
                            "country_iso": country_iso,
                            "latitude": lat,
                            "longitude": lon,
                            "magnitude": None,
                            "casualties_estimated": _detect_casualties(combined),
                            "event_date": pub_date,
                            "source_names": [f"{source_label} RSS"],
                            "official_confirmed": True,
                            "trust_score": 0.94,
                            "ai_confidence": 0.88,
                            "raw_text": combined[:500],
                            "source_event_id": f"whoun_{uid}",
                        })
                except Exception as e:
                    print(f"WHO/UN feed ({source_label}) failed: {e}")
    except Exception as e:
        print(f"fetch_who_rss failed: {e}")
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
