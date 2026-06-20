import httpx
import json
import re
from app.core.config import settings

CLASSIFICATION_PROMPT = """
    You are an expert software bug classification system.

    Analyze the following bug report and respond ONLY with a valid JSON object.
    No explanations, no markdown, no code blocks. Just raw JSON.

    AVAILABLE MODULES:
    - auth (login, registration, passwords, sessions)
    - payments (payments, billing, subscriptions)
    - dashboard (main screen, metrics, charts)
    - profile (user profile, settings)
    - notifications (alerts, emails, push)
    - api (endpoints, integrations, webhooks)
    - ui (interface, buttons, forms, styles)
    - database (data, queries, performance)
    - other (anything that doesn't fit above)

    USER REPORT:
    {description}

    ADDITIONAL CONTEXT:
    {context}

    Respond with this exact JSON:
    {{
    "title": "short descriptive bug title (max 10 words)",
    "severity": "critical|high|medium|low",
    "module": "one of the modules above",
    "reproduction_steps": "1. Step one 2. Step two 3. Step three",
    "suggested_fix": "possible cause and how to fix it",
    "ai_summary": "one sentence summary of the problem",
    "ai_confidence": 85
    }}

    SEVERITY CRITERIA:
    - critical: app is broken, data loss, security failure
    - high: important feature broken, affects many users
    - medium: partially broken feature, workaround exists
    - low: cosmetic issue, minor annoyance
"""

# send the bug report to the Ollama API for classification
async def classify_bug(description: str, context: dict = None) -> dict:

    context_str = "Without additional context"
    if context:
        parts = []
        if context.get("browser"):
            parts.append(f"Browser: {context['browser']}")
        if context.get("operating_system"):
            parts.append(f"Operating System: {context['operating_system']}")
        if context.get("current_url"):
            parts.append(f"Current URL: {context['current_url']}")
        if context.get("screen_resolution"):
            parts.append(f"Screen Resolution: {context['screen_resolution']}")
        if parts:
            context_str = "\n".join(parts)
    
    prompt = CLASSIFICATION_PROMPT.format(description=description, context=context_str)

    async with httpx.AsyncClient(timeout=settings.OLLAMA_TIMEOUT) as client:
        response = await client.post(
            f"{settings.OLLAMA_BASE_URL}/api/generate",
            json={
                "model": settings.OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False
            },
        )
        response.raise_for_status()
    
    raw = response.json()["response"].strip()

    start = raw.find('{')
    end = raw.rfind('}')

    if start == -1:
        raise ValueError(f"No JSON found in Ollama response: {raw}")

    # Add closing brace if missing
    if end == -1 or end < start:
        json_str = raw[start:] + '}'
    else:
        json_str = raw[start:end+1]

    # Clean arrays in reproduction_steps — convert to string
    json_str = re.sub(
        r'"reproduction_steps":\s*\[([^\]]*)\]',
        lambda m: '"reproduction_steps": "' + 
            re.sub(r'[\n\r]+', ' ', m.group(1)).strip().replace('"', '') + '"',
        json_str,
        flags=re.DOTALL
    )

    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON from Ollama: {e}\nRaw: {json_str}")

# Check if the Ollama API is healthy
async def check_ollama_health() -> bool:
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            response = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            return response.status_code == 200
    except Exception:
        return False
