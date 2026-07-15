# ======================================================================
# CrisisLens Crisis Data Processor - Production Version
# ======================================================================
import asyncio
import aiohttp
import feedparser
import json
import pickle
import re
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional
from geopy.geocoders import Nominatim
from collections import Counter
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import logging

from ..core.config import settings
from ..models.crisis_event import CrisisEvent, CrisisEventCreate
from ..core.database import database
from ..utils.ai_client import get_gemma_client

logger = logging.getLogger(__name__)

class CrisisProcessor:
    """Production-ready crisis data processing pipeline"""
    
    def __init__(self):
        self.client = get_gemma_client()
        self.geolocator = Nominatim(user_agent="crisislens_production")
        self._geocode_cache = {}
        self._classification_cache = {}
        
        # Initialize models
        self.binary_filter = None
        self.sentence_transformer = None
        self.rate_limiter = RateLimiter(calls_per_minute=15)
        
        # Data sources from your optimized notebook
        self.sources = [
            {
                "name": "USGS",
                "url": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.atom?minlatitude=-11&maxlatitude=38&minlongitude=60&maxlongitude=141",
                "format": "rss", "type": "official", "trust": 1.00, "hint": "earthquake"
            },
            {
                "name": "BMKG", 
                "url": "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json",
                "format": "json", "type": "official", "trust": 1.00, "hint": "earthquake"
            },
            {
                "name": "WHO", 
                "url": "https://www.who.int/rss-feeds/news-english.xml",
                "format": "rss", "type": "official", "trust": 0.95, "hint": "disease"
            },
            {
                "name": "ReliefWeb", 
                "url": "https://reliefweb.int/updates/rss.xml",
                "format": "rss", "type": "official", "trust": 0.95, "hint": "multi"
            },
            {
                "name": "BBC", 
                "url": "https://feeds.bbci.co.uk/news/world/rss.xml",
                "format": "rss", "type": "news", "trust": 0.90, "hint": "multi"
            }
        ]
        
        # Initialize async
        asyncio.create_task(self._init_models())
    
    async def _init_models(self):
        """Initialize AI models asynchronously"""
        try:
            logger.info("🤖 Loading AI models...")
            def load_models():
                from transformers import pipeline as hf_pipeline
                from sentence_transformers import SentenceTransformer
                b_filter = hf_pipeline(
                    "zero-shot-classification",
                    model="MoritzLaurer/mDeBERTa-v3-base-mnli-xnli",
                    device=0 if __import__("torch").cuda.is_available() else -1
                )
                s_transformer = SentenceTransformer('all-MiniLM-L6-v2')
                return b_filter, s_transformer
                
            self.binary_filter, self.sentence_transformer = await asyncio.to_thread(load_models)
            
            logger.info("✅ AI models loaded successfully")
            
        except Exception as e:
            logger.warning(f"⚠️ Local ML models not available ({e}). Using keyword & API classification fallback.")
    
    async def collect_and_process(self) -> List[CrisisEvent]:
        """Main processing pipeline - collect, filter, classify, deduplicate"""
        try:
            # Step 1: Collect raw data
            raw_reports = await self._collect_from_all_sources()
            logger.info(f"📥 Collected {len(raw_reports)} raw reports")
            
            # Step 2: Filter for crisis relevance
            crisis_reports = self._filter_crisis_relevant(raw_reports)
            logger.info(f"🔍 Filtered to {len(crisis_reports)} crisis-relevant reports")
            
            # Step 3: Binary classification filter
            filtered_reports = await self._apply_binary_filter(crisis_reports)
            logger.info(f"🎯 Binary filter: {len(filtered_reports)} reports passed")
            
            # Step 4: AI classification and geocoding
            classified_events = await self._classify_and_geocode(filtered_reports)
            logger.info(f"🧠 Classified {len(classified_events)} events")
            
            # Step 5: Deduplication and event fusion
            final_events = await self._deduplicate_events(classified_events)
            logger.info(f"🔗 Final events after deduplication: {len(final_events)}")
            
            # Step 6: Save to database
            saved_events = await self._save_events(final_events)
            
            return saved_events
            
        except Exception as e:
            logger.error(f"❌ Processing pipeline error: {e}")
            return []
    
    async def _collect_from_all_sources(self) -> List[Dict]:
        """Collect data from all configured sources"""
        all_reports = []
        
        async with aiohttp.ClientSession() as session:
            tasks = []
            for source in self.sources:
                if source["format"] == "rss":
                    tasks.append(self._collect_rss(session, source))
                elif source["format"] == "json":
                    tasks.append(self._collect_json(session, source))
            
            # Execute all collections concurrently
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in results:
                if isinstance(result, list):
                    all_reports.extend(result)
                elif isinstance(result, Exception):
                    logger.error(f"Collection error: {result}")
        
        # Remove URL duplicates
        seen_urls = set()
        unique_reports = []
        for report in all_reports:
            url_key = report.get("source_url", "") or report["raw_text"][:100]
            if url_key not in seen_urls:
                seen_urls.add(url_key)
                unique_reports.append(report)
        
        return unique_reports
    
    async def _collect_rss(self, session: aiohttp.ClientSession, source: Dict) -> List[Dict]:
        """Collect from RSS source"""
        reports = []
        try:
            async with session.get(source["url"], timeout=30) as response:
                content = await response.text()
                feed = feedparser.parse(content)
                
                for entry in feed.entries[:50]:
                    title = entry.get("title", "")
                    summary = re.sub("<.*?>", " ", entry.get("summary", ""))
                    text = f"{title}. {summary}".strip()
                    
                    if len(text) >= 25:
                        reports.append({
                            "source_name": source["name"],
                            "source_type": source["type"],
                            "trust_score": source["trust"],
                            "raw_text": text,
                            "source_url": entry.get("link", ""),
                            "crisis_hint": source["hint"],
                            "published_at": entry.get("published", datetime.now(timezone.utc).isoformat())
                        })
                        
        except Exception as e:
            logger.error(f"RSS collection failed for {source['name']}: {e}")
        
        return reports
    
    async def _collect_json(self, session: aiohttp.ClientSession, source: Dict) -> List[Dict]:
        """Collect from JSON API source"""
        reports = []
        try:
            async with session.get(source["url"], timeout=30) as response:
                data = await response.json()
                
                if source["name"] == "BMKG":
                    gempa = data.get("Infogempa", {}).get("gempa", {})
                    if gempa:
                        text = (f"Gempa bumi Magnitude {gempa.get('Magnitude','?')} "
                               f"di {gempa.get('Wilayah','Unknown')}. "
                               f"Kedalaman {gempa.get('Kedalaman','?')}.")
                        
                        reports.append({
                            "source_name": "BMKG",
                            "source_type": "official",
                            "trust_score": 1.0,
                            "raw_text": text,
                            "source_url": "https://www.bmkg.go.id",
                            "crisis_hint": "earthquake",
                            "published_at": datetime.now(timezone.utc).isoformat()
                        })
                        
        except Exception as e:
            logger.error(f"JSON collection failed for {source['name']}: {e}")
        
        return reports
    
    def _filter_crisis_relevant(self, reports: List[Dict]) -> List[Dict]:
        """Filter reports for crisis relevance and target geography"""
        # Your existing filtering logic from the notebook
        TARGET_KEYWORDS = {
            "locations": ["indonesia", "jakarta", "bandung", "bali", "java", "sumatra", 
                         "india", "delhi", "mumbai", "philippines", "manila"],
            "disasters": ["earthquake", "flood", "tsunami", "volcano", "wildfire", 
                         "disaster", "emergency", "gempa", "banjir", "bencana"]
        }
        
        filtered = []
        for report in reports:
            text = report["raw_text"].lower()
            
            # Always include official sources like BMKG
            if report["source_name"] in ["BMKG"]:
                filtered.append(report)
                continue
            
            # Check for location + disaster keywords
            has_location = any(kw in text for kw in TARGET_KEYWORDS["locations"])
            has_disaster = any(kw in text for kw in TARGET_KEYWORDS["disasters"])
            
            if report["crisis_hint"] in ["earthquake", "disease"] and has_location:
                filtered.append(report)
            elif has_location and has_disaster:
                filtered.append(report)
        
        return filtered
    
    async def _apply_binary_filter(self, reports: List[Dict]) -> List[Dict]:
        """Apply binary crisis classification filter"""
        if not self.binary_filter:
            return reports
        
        filtered = []
        for report in reports:
            try:
                result = self.binary_filter(
                    report["raw_text"][:512],
                    candidate_labels=["crisis or disaster", "not crisis"]
                )
                
                if result["labels"][0] == "crisis or disaster" and result["scores"][0] >= 0.65:
                    filtered.append(report)
                    
            except Exception as e:
                logger.warning(f"Binary filter error: {e}")
                filtered.append(report)  # Include on error
        
        return filtered
    
    async def _classify_and_geocode(self, reports: List[Dict]) -> List[Dict]:
        """Classify events and add geocoding using Gemma AI"""
        classified = []
        
        for report in reports:
            # Check cache first
            cache_key = hash(report["raw_text"][:200])
            if cache_key in self._classification_cache:
                classified.append(self._classification_cache[cache_key])
                continue
            
            # Rate limit API calls
            await self.rate_limiter.wait()
            
            # Classify with Gemma
            result = await self._classify_with_gemma(report)
            
            # Add geocoding
            if result.get("location_name"):
                lat, lon = await self._geocode_location(result["location_name"])
                result["latitude"] = lat
                result["longitude"] = lon
            
            # Cache successful results
            if not result.get("_parse_failed"):
                self._classification_cache[cache_key] = result
            
            classified.append(result)
        
        return classified
    
    async def _classify_with_gemma(self, report: Dict) -> Dict:
        """Classify event using Gemma AI"""
        prompt = f"""Analyze this crisis report and extract structured information.

Text: {report['raw_text'][:1200]}
Source: {report['source_name']} (trust: {report['trust_score']})

Return valid JSON:
{{
  "crisis_type": "earthquake|flood|wildfire|storm|volcano|disease|other",
  "severity": "low|medium|high|critical", 
  "confidence": 0.85,
  "location_name": "place name or null",
  "casualties": null,
  "magnitude": null
}}"""

        try:
            response = await self.client.generate_content(
                prompt,
                temperature=0.0,
                max_tokens=500
            )
            
            if response.text:
                parsed = json.loads(response.text)
                return {**report, **parsed}
                
        except Exception as e:
            logger.error(f"Gemma classification failed: {e}")
        
        # Fallback
        return {
            **report,
            "crisis_type": "other",
            "severity": "low", 
            "confidence": 0.3,
            "_parse_failed": True
        }
    
    async def _geocode_location(self, location_name: str) -> tuple:
        """Geocode location with caching and fallbacks"""
        if not location_name or location_name in self._geocode_cache:
            return self._geocode_cache.get(location_name, (None, None))
        
        # Try geocoding with multiple strategies
        strategies = [
            location_name,
            f"{location_name.split(',')[0]}, Southeast Asia",
            f"{location_name.split(',')[0]}, Indonesia"
        ]
        
        for strategy in strategies:
            try:
                result = self.geolocator.geocode(strategy, timeout=10)
                if result:
                    coords = (result.latitude, result.longitude)
                    self._geocode_cache[location_name] = coords
                    return coords
            except:
                continue
        
        # Country fallbacks
        country_coords = {
            "indonesia": (-2.5, 118.0),
            "india": (20.5937, 78.9629),
            "philippines": (12.8797, 121.7740)
        }
        
        for country, coords in country_coords.items():
            if country in location_name.lower():
                self._geocode_cache[location_name] = coords
                return coords
        
        self._geocode_cache[location_name] = (None, None)
        return (None, None)
    
    async def _deduplicate_events(self, events: List[Dict]) -> List[Dict]:
        """Deduplicate similar events using semantic similarity"""
        if not self.sentence_transformer or len(events) < 2:
            return events
        
        # Create embeddings for all events
        texts = [event["raw_text"] for event in events]
        embeddings = self.sentence_transformer.encode(texts)
        
        # Calculate similarity matrix
        similarity_matrix = cosine_similarity(embeddings)
        
        # Group similar events
        groups = []
        used = set()
        
        for i in range(len(events)):
            if i in used:
                continue
                
            group = [i]
            for j in range(i + 1, len(events)):
                if j in used:
                    continue
                    
                # Check similarity and geographic proximity
                if (similarity_matrix[i][j] > 0.75 and
                    self._are_geographically_close(events[i], events[j])):
                    group.append(j)
                    used.add(j)
            
            groups.append(group)
            used.add(i)
        
        # Create merged events
        merged_events = []
        for group in groups:
            if len(group) == 1:
                merged_events.append(events[group[0]])
            else:
                # Merge multiple events into one
                merged = self._merge_events([events[idx] for idx in group])
                merged_events.append(merged)
        
        return merged_events
    
    def _are_geographically_close(self, event1: Dict, event2: Dict) -> bool:
        """Check if two events are geographically close"""
        lat1, lon1 = event1.get("latitude"), event1.get("longitude")
        lat2, lon2 = event2.get("latitude"), event2.get("longitude")
        
        if not all([lat1, lon1, lat2, lon2]):
            return False
        
        # Simple distance check (can be improved with proper geospatial calculation)
        distance = ((lat1 - lat2) ** 2 + (lon1 - lon2) ** 2) ** 0.5
        return distance < 5.0  # Approximately 500km threshold
    
    def _merge_events(self, events: List[Dict]) -> Dict:
        """Merge multiple similar events into one consolidated event"""
        # Use the highest trust source as base
        base_event = max(events, key=lambda e: e.get("trust_score", 0))
        
        # Combine information from all events
        merged = base_event.copy()
        merged.update({
            "source_count": len(events),
            "sources": [e["source_name"] for e in events],
            "confidence": min(1.0, base_event.get("confidence", 0.5) + 0.1 * len(events)),
            "raw_texts": [e["raw_text"] for e in events]
        })
        
        return merged
    
    async def _save_events(self, events: List[Dict]) -> List[CrisisEvent]:
        """Save events to database"""
        saved_events = []
        
        for event_data in events:
            try:
                # Convert to Pydantic model
                crisis_event_data = CrisisEventCreate(
                    crisis_type=event_data.get("crisis_type", "other"),
                    severity=event_data.get("severity", "low"),
                    confidence=event_data.get("confidence", 0.5),
                    location_name=event_data.get("location_name"),
                    latitude=event_data.get("latitude"),
                    longitude=event_data.get("longitude"),
                    raw_text=event_data.get("raw_text", ""),
                    source_name=event_data.get("source_name", "unknown"),
                    source_type=event_data.get("source_type", "unknown"),
                    trust_score=event_data.get("trust_score", 0.5),
                    casualties=event_data.get("casualties"),
                    magnitude=event_data.get("magnitude"),
                    source_count=event_data.get("source_count", 1)
                )
                
                # Save to database
                query = """
                INSERT INTO crisis_events 
                (crisis_type, severity, confidence, location_name, country_iso, latitude, longitude, 
                 raw_text, source_name, source_type, trust_score, casualties, magnitude, 
                 source_count, official_confirmed, event_date, created_at, updated_at)
                VALUES 
                (:crisis_type, :severity, :confidence, :location_name, :country_iso, :latitude, :longitude,
                 :raw_text, :source_name, :source_type, :trust_score, :casualties, :magnitude,
                 :source_count, :official_confirmed, :event_date, :created_at, :updated_at)
                RETURNING *
                """
                
                values = crisis_event_data.dict()
                values.update({
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                })
                
                result = await database.fetch_one(query, values)
                if result:
                    saved_events.append(CrisisEvent(**dict(result)))
                    
            except Exception as e:
                logger.error(f"Failed to save event: {e}")
        
        logger.info(f"💾 Saved {len(saved_events)} events to database")
        return saved_events

class RateLimiter:
    """Simple rate limiter for API calls"""
    def __init__(self, calls_per_minute=15):
        self.min_interval = 60.0 / calls_per_minute
        self.last_call = 0
    
    async def wait(self):
        import time
        now = time.time()
        diff = now - self.last_call
        if diff < self.min_interval:
            sleep_time = self.min_interval - diff
            await asyncio.sleep(sleep_time)
        self.last_call = time.time()