import asyncio
import json
from core.config import get_settings
from core.llm import get_llm
from models.state import AgentState
from langchain_core.messages import HumanMessage, SystemMessage

settings = get_settings()

_SYSTEM = (
    "You are a business intelligence analyst. "
    "Analyse external signals for a B2B customer. "
    "Output ONLY valid JSON, no markdown."
)


async def external_research_agent(state: AgentState) -> AgentState:
    customer_name = state["customer_name"]
    logs: list[str] = []

    if (
        not settings.tavily_api_key
        or settings.tavily_api_key == "your_tavily_api_key_here"
    ):
        logs.append(
            "[ExternalResearch] TAVILY_API_KEY not set — using demo mock data"
        )
        return {
            **state,
            "external_intel": _mock_intel(customer_name),
            "agent_logs": logs,
        }

    try:
        from tavily import AsyncTavilyClient  # imported lazily
        client = AsyncTavilyClient(api_key=settings.tavily_api_key)
        queries = [
            f"{customer_name} company news 2024 2025",
            f"{customer_name} funding investment expansion",
            f"{customer_name} hiring growth acquisitions leadership",
        ]

        responses = await asyncio.gather(
            *[client.search(q, max_results=3, search_depth="basic") for q in queries],
            return_exceptions=True,
        )

        all_articles: list[dict] = []
        for idx, resp in enumerate(responses):
            if isinstance(resp, Exception):
                logs.append(
                    f"[ExternalResearch] Query {idx + 1} failed: {str(resp)[:60]}"
                )
                continue
            for a in resp.get("results", []):
                all_articles.append(
                    {
                        "title": a.get("title", ""),
                        "url": a.get("url", ""),
                        "content": a.get("content", "")[:600],
                        "score": a.get("score", 0),
                    }
                )

        logs.append(
            f"[ExternalResearch] {len(all_articles)} articles retrieved via Tavily"
        )

        llm = get_llm()
        articles_text = "\n---\n".join(
            f"Title: {a['title']}\nURL: {a['url']}\nContent: {a['content']}"
            for a in all_articles[:8]
        )

        synthesis = await llm.ainvoke([
            SystemMessage(content=_SYSTEM),
            HumanMessage(content=f"""Analyse external intelligence for: {customer_name}

Articles:
{articles_text[:3500]}

Return JSON:
{{
  "funding_events": [],
  "expansion_signals": [],
  "hiring_trends": [],
  "acquisitions": [],
  "leadership_changes": [],
  "financial_health": {{}},
  "strategic_initiatives": [],
  "sentiment": {{"score": "positive|neutral|negative", "reason": ""}},
  "summary": "2-3 sentence executive summary",
  "sources": []
}}"""),
        ])

        raw = synthesis.content.strip()
        if raw.startswith("```"):
            parts = raw.split("```")
            raw = parts[1] if len(parts) > 1 else raw
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        try:
            intel = json.loads(raw)
            intel["raw_articles"] = all_articles[:6]
        except Exception:
            intel = {
                "summary": "Synthesis parse failed",
                "raw_articles": all_articles[:6],
            }

        logs.append(
            f"[ExternalResearch] Synthesised — "
            f"sentiment: {intel.get('sentiment', {}).get('score', 'unknown')}"
        )
        return {**state, "external_intel": intel, "agent_logs": logs}

    except Exception as e:
        logs.append(
            f"[ExternalResearch] Error: {str(e)[:100]} — falling back to mock"
        )
        return {**state, "external_intel": _mock_intel(customer_name), "agent_logs": logs}


def _mock_intel(customer_name: str) -> dict:
    """Realistic mock data for demo / missing API key."""
    return {
        "summary": (
            f"{customer_name} recently closed a $45M Series B and is actively "
            "expanding into APAC markets. Aggressive engineering hiring signals "
            "a major product investment cycle."
        ),
        "funding_events": [
            {"amount": "$45M Series B", "date": "Q3 2024", "investors": ["a16z", "Sequoia"]}
        ],
        "expansion_signals": [
            "APAC office opening — Singapore Q1 2025",
            "New EMEA sales team in London",
        ],
        "hiring_trends": [
            "Engineering +40 open roles",
            "Sales Development +15 roles",
            "Customer Success +8 roles",
        ],
        "acquisitions": [],
        "leadership_changes": [
            {"change": "New CTO hired from Stripe", "date": "Oct 2024"}
        ],
        "financial_health": {
            "status": "Growth stage",
            "signals": "Increased ad spend, refreshed pricing page",
        },
        "strategic_initiatives": [
            "AI-first product pivot",
            "SOC2 Type II certification in progress",
        ],
        "sentiment": {
            "score": "positive",
            "reason": "Strong growth signals; heavy investment in product and people",
        },
        "raw_articles": [],
        "note": "Mock data — set TAVILY_API_KEY in .env for live intelligence",
    }