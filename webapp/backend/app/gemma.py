"""
Ported directly from crisislens_dashboard.py / crisislens_telegram_bot.py —
same ROLE_INSTRUCTIONS, same grounding approach, same SDK call pattern.
Moving this server-side (instead of client-side JS, as in the static
dashboard.html) is what keeps GOOGLE_API_KEY out of the browser.
"""
from google import genai
from google.genai import types

from app.config import settings
from app.models import Event

client = genai.Client(api_key=settings.google_api_key) if settings.google_api_key else None

ROLE_INSTRUCTIONS = {
    "citizen": (
        "You are CrisisLens AI for CITIZENS. Keep citizens safe WITHOUT causing panic. "
        "Calm, reassuring, practical tone. Give simple safety actions, not raw technical detail. "
        "Never use words like CRITICAL/URGENT unless truly critical severity."
    ),
    "tourist": (
        "You are CrisisLens AI for TOURISTS. Answer 'should I go there' style travel-safety questions. "
        "Be informative and reassuring where possible, honest about real risk where not."
    ),
    "responder": (
        "You are CrisisLens AI for EMERGENCY RESPONDERS. Full tactical detail: severity, confidence, "
        "location precision, casualties/magnitude if available. No softening."
    ),
    "government": (
        "You are CrisisLens AI for GOVERNMENT OFFICIALS. Full detail: risk level, criticality, "
        "resource-allocation implications, confidence and corroboration. No softening."
    ),
}


def build_events_context(events: list[Event], max_events: int = 15) -> str:
    if not events:
        return "No active verified crisis events at this time."

    lines = []
    for i, e in enumerate(events[:max_events], 1):
        crisis_type = (e.crisis_type or "unknown").lower()
        if crisis_type in ("other", "unknown", ""):
            continue
        extra = ""
        if crisis_type == "earthquake" and e.magnitude:
            extra = f" | Magnitude: {e.magnitude}"
        elif e.casualties_estimated:
            extra = f" | Est. Affected: {e.casualties_estimated}"
        lines.append(
            f"{i}. {crisis_type.title()} in {e.location_name or 'Unknown'} "
            f"({e.country_iso or '?'}) | Severity: {(e.severity or '?').upper()} | "
            f"Confidence: {e.system_confidence:.0%}{extra} | "
            f"Sources: {', '.join(e.source_names or ['Unknown'])}"
        )
    return "\n".join(lines) if lines else "No classified crisis events at this time."


def _call_gemma(prompt: str, model: str | None = None, temperature: float = 0.2,
                 max_output_tokens: int = 2048) -> str:
    if client is None:
        return "⚠️ No GOOGLE_API_KEY configured on the backend."

    try:
        config_kwargs = dict(temperature=temperature, max_output_tokens=max_output_tokens)
        try:
            config_kwargs["thinking_config"] = types.ThinkingConfig(thinking_budget=0)
        except Exception:
            pass  # older SDK/model without thinking_config support — fine, skip it

        resp = client.models.generate_content(
            model=model or settings.deep_model,
            contents=prompt,
            config=types.GenerateContentConfig(**config_kwargs),
        )
        if resp.text and resp.text.strip():
            return resp.text.strip()
        return "⚠️ Empty response from model — please try again."
    except Exception as e:
        return f"⚠️ AI request failed: {e}"


def ask_crisislens(question: str, events: list[Event], role: str = "citizen", lang: str = "en") -> str:
    context = build_events_context(events)
    instruction = ROLE_INSTRUCTIONS.get(role, ROLE_INSTRUCTIONS["citizen"])
    language_instruction = "Answer in Bahasa Indonesia." if lang == "id" else "Answer in English."

    prompt = f"""{instruction}

Current verified crisis events:
{context}

User question: {question}

Answer ONLY from the verified events above. If nothing matches, say so clearly
instead of guessing. Be concise (3-6 sentences). {language_instruction}

ANSWER:"""
    return _call_gemma(prompt)


def classify_report(raw_text: str, source_name: str) -> dict | None:
    """
    Structured extraction — same schema-first approach as Cell 6 of the
    notebook. Returns None if Gemma can't produce valid structured output.
    """
    prompt = f"""Extract structured crisis data from this report as JSON only,
no markdown, no explanation.

Report source: {source_name}
Report text: {raw_text[:1500]}

Return exactly this JSON shape:
{{
  "crisis_type": "earthquake|flood|volcano|wildfire|landslide|storm|disease|other",
  "severity": "low|medium|high|critical",
  "location_name": "<city or region, or null>",
  "country_iso": "<2-letter code, or null>",
  "magnitude": <number or null>,
  "casualties_estimated": <number or null>,
  "confidence": <0.0-1.0>
}}"""
    raw = _call_gemma(prompt, model=settings.fast_model, temperature=0.1, max_output_tokens=400)
    try:
        import json
        cleaned = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        return json.loads(cleaned)
    except Exception:
        return None
