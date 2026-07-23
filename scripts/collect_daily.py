#!/usr/bin/env python3
"""
CrisisLens Daily Collection Script
===================================
Runs via GitHub Actions every day at 06:00 UTC.
Collects real crisis events from USGS, BMKG, ReliefWeb, and WHO.
Saves output to data/ folder which gets committed to the repo.

No Docker needed — pure Python, runs free on GitHub's servers.
"""

import json
import csv
import re
import sys
import requests
import feedparser
from datetime import datetime, timezone
from pathlib import Path

# Fix emoji output on Windows terminals
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# ── Configuration ──────────────────────────────────────────────────────────────

SOURCES = [
    {
        "name": "USGS",
        "url": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.atom",
        "type": "rss",
        "trust": 1.00,
    },
    {
        "name": "BMKG",
        "url": "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json",
        "type": "bmkg_json",
        "trust": 1.00,
    },
    {
        "name": "ReliefWeb",
        "url": "https://reliefweb.int/updates/rss.xml",
        "type": "rss",
        "trust": 0.95,
    },
    {
        "name": "WHO",
        "url": "https://www.who.int/rss-feeds/news-english.xml",
        "type": "rss",
        "trust": 0.90,
    },
    {
        "name": "GDACS",
        "url": "https://www.gdacs.org/xml/rss.xml",
        "type": "rss",
        "trust": 0.95,
    },
]

CRISIS_KEYWORDS = [
    "earthquake", "flood", "tsunami", "volcano", "eruption",
    "cyclone", "typhoon", "landslide", "wildfire", "disaster",
    "emergency", "outbreak", "epidemic", "drought", "famine",
    "gempa", "banjir", "bencana", "longsor", "erupsi",
    "magnitude", "seismic", "aftershock", "alert", "evacuation",
]

TARGET_REGIONS = [
    "indonesia", "philippines", "bangladesh", "india", "vietnam",
    "thailand", "myanmar", "nepal", "java", "sumatra", "sulawesi",
    "kalimantan", "jakarta", "manila", "dhaka", "southeast asia",
    "asia pacific", "pacific", "indian ocean",
]

TODAY = datetime.now(timezone.utc).strftime("%Y-%m-%d")
NOW_ISO = datetime.now(timezone.utc).isoformat()
DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)


# ── Helpers ────────────────────────────────────────────────────────────────────

def strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", " ", text).strip()

def is_relevant(text: str) -> bool:
    tl = text.lower()
    return any(kw in tl for kw in CRISIS_KEYWORDS) or any(r in tl for r in TARGET_REGIONS)


# ── Collectors ─────────────────────────────────────────────────────────────────

def collect_rss(source: dict) -> list:
    events = []
    try:
        feed = feedparser.parse(source["url"])
        for entry in feed.entries[:40]:
            title = strip_html(entry.get("title", ""))
            summary = strip_html(entry.get("summary", ""))
            text = f"{title}. {summary}"

            # For USGS — every entry IS an earthquake, always include
            # For others — filter by keyword/region relevance
            if source["name"] == "USGS" or is_relevant(text):
                events.append({
                    "source": source["name"],
                    "trust_score": source["trust"],
                    "crisis_type": _infer_type(source["name"], text),
                    "title": title[:300],
                    "summary": text[:600],
                    "url": entry.get("link", ""),
                    "published": entry.get("published", TODAY),
                    "collected_at": NOW_ISO,
                })
    except Exception as exc:
        print(f"  ⚠️  {source['name']}: {exc}")
    return events


def collect_bmkg() -> list:
    events = []
    try:
        r = requests.get(
            "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json",
            timeout=15,
            headers={"User-Agent": "CrisisLens/1.0 (github.com/duleab/crisislens)"},
        )
        r.raise_for_status()
        gempa = r.json().get("Infogempa", {}).get("gempa", {})
        if gempa:
            events.append({
                "source": "BMKG",
                "trust_score": 1.00,
                "crisis_type": "earthquake",
                "title": f"Gempa M{gempa.get('Magnitude', '?')} — {gempa.get('Wilayah', 'Unknown')}",
                "summary": (
                    f"Magnitude {gempa.get('Magnitude', '?')}, "
                    f"Depth {gempa.get('Kedalaman', '?')}, "
                    f"Location: {gempa.get('Wilayah', 'Unknown')}. "
                    f"Potential: {gempa.get('Potensi', 'N/A')}"
                ),
                "url": "https://www.bmkg.go.id",
                "published": gempa.get("Tanggal", TODAY),
                "collected_at": NOW_ISO,
                "latitude": _safe_float(gempa.get("Lintang")),
                "longitude": _safe_float(gempa.get("Bujur")),
                "magnitude": _safe_float(gempa.get("Magnitude")),
            })
    except Exception as exc:
        print(f"  ⚠️  BMKG: {exc}")
    return events


def _safe_float(value) -> float | None:
    try:
        return float(str(value).replace("°LS", "").replace("°LU", "").replace("°BT", "").replace("°BB", "").strip())
    except Exception:
        return None


def _infer_type(source: str, text: str) -> str:
    tl = text.lower()
    if source == "USGS" or "earthquake" in tl or "gempa" in tl or "magnitude" in tl or "seismic" in tl:
        return "earthquake"
    if "flood" in tl or "banjir" in tl:
        return "flood"
    if "volcano" in tl or "eruption" in tl or "erupsi" in tl:
        return "volcano"
    if "wildfire" in tl or "fire" in tl:
        return "wildfire"
    if "typhoon" in tl or "cyclone" in tl or "hurricane" in tl or "storm" in tl:
        return "storm"
    if "tsunami" in tl:
        return "tsunami"
    if "landslide" in tl or "longsor" in tl:
        return "landslide"
    if "outbreak" in tl or "epidemic" in tl or "disease" in tl:
        return "disease"
    return "other"


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    print(f"\n🌍 CrisisLens Daily Collection — {TODAY}")
    print("=" * 55)

    all_events = []

    for source in SOURCES:
        if source["type"] == "bmkg_json":
            events = collect_bmkg()
        else:
            events = collect_rss(source)

        all_events.extend(events)
        status = "✅" if events else "⚠️ "
        print(f"  {status} {source['name']:<15} {len(events):>3} events")

    print(f"\n  📦 Total collected: {len(all_events)} events")

    # ── Deduplicate by title ───────────────────────────────────────
    seen_titles = set()
    unique_events = []
    for e in all_events:
        t = e["title"].lower().strip()
        if t not in seen_titles:
            seen_titles.add(t)
            unique_events.append(e)

    print(f"  🔄 After dedup:    {len(unique_events)} unique events")

    # ── Source breakdown ──────────────────────────────────────────
    source_counts: dict[str, int] = {}
    type_counts: dict[str, int] = {}
    for e in unique_events:
        source_counts[e["source"]] = source_counts.get(e["source"], 0) + 1
        type_counts[e["crisis_type"]] = type_counts.get(e["crisis_type"], 0) + 1

    # ── Save daily JSON report ────────────────────────────────────
    report = {
        "date": TODAY,
        "collected_at": NOW_ISO,
        "total_events": len(unique_events),
        "by_source": source_counts,
        "by_type": type_counts,
        "events": unique_events,
    }

    report_path = DATA_DIR / f"daily_report_{TODAY}.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"\n  💾 Saved: {report_path}")

    # ── Append to cumulative stats CSV ────────────────────────────
    stats_path = DATA_DIR / "stats_log.csv"
    is_new_file = not stats_path.exists()

    with open(stats_path, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "date", "total_events",
            "usgs", "bmkg", "reliefweb", "who", "gdacs",
            "earthquake", "flood", "volcano", "storm", "wildfire", "disease", "other",
        ])
        if is_new_file:
            writer.writeheader()
        writer.writerow({
            "date": TODAY,
            "total_events": len(unique_events),
            "usgs": source_counts.get("USGS", 0),
            "bmkg": source_counts.get("BMKG", 0),
            "reliefweb": source_counts.get("ReliefWeb", 0),
            "who": source_counts.get("WHO", 0),
            "gdacs": source_counts.get("GDACS", 0),
            "earthquake": type_counts.get("earthquake", 0),
            "flood": type_counts.get("flood", 0),
            "volcano": type_counts.get("volcano", 0),
            "storm": type_counts.get("storm", 0),
            "wildfire": type_counts.get("wildfire", 0),
            "disease": type_counts.get("disease", 0),
            "other": type_counts.get("other", 0),
        })
    print(f"  📊 Stats appended: {stats_path}")

    # ── Save event count for commit message ───────────────────────
    with open(DATA_DIR / ".event_count.txt", "w") as f:
        f.write(str(len(unique_events)))

    # ── Update README badge section ───────────────────────────────
    readme_badge = f"""<!-- CRISISLENS_STATS_START -->
## 📊 Latest Pipeline Run

| Field | Value |
|-------|-------|
| **Last Run** | {TODAY} |
| **Events Detected** | {len(unique_events)} |
| **Sources Active** | {len(source_counts)} ({', '.join(source_counts.keys())}) |
| **Top Crisis Type** | {max(type_counts, key=type_counts.get) if type_counts else 'N/A'} ({max(type_counts.values()) if type_counts else 0} events) |

*🤖 Auto-updated daily by GitHub Actions — [View latest report](data/daily_report_{TODAY}.json)*
<!-- CRISISLENS_STATS_END -->"""

    readme_path = Path("README.md")
    if readme_path.exists():
        content = readme_path.read_text(encoding="utf-8")
        pattern = r"<!-- CRISISLENS_STATS_START -->.*?<!-- CRISISLENS_STATS_END -->"
        if re.search(pattern, content, re.DOTALL):
            content = re.sub(pattern, readme_badge, content, flags=re.DOTALL)
        else:
            content += f"\n\n{readme_badge}\n"
        readme_path.write_text(content, encoding="utf-8")
        print(f"  📝 README updated")
    else:
        # Create a basic README if it doesn't exist
        with open(readme_path, "w", encoding="utf-8") as f:
            f.write(f"# 🌍 CrisisLens\n\nAutomated crisis intelligence pipeline for Southeast Asia.\n\nCollects real disaster data from USGS, BMKG, WHO, GDACS, and ReliefWeb every day.\n\n{readme_badge}\n")
        print(f"  📝 README created")

    print(f"\n✅ Done — {len(unique_events)} events saved for {TODAY}\n")


if __name__ == "__main__":
    main()
