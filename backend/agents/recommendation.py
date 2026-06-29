import json
from core.llm import get_llm
from models.state import AgentState
from langchain_core.messages import HumanMessage, SystemMessage

_SYSTEM = """You are a Chief Customer Officer AI generating precise, actionable Next Best Actions
for a B2B SaaS Customer Success team.

Every recommendation must be:
- SPECIFIC  : "Schedule 45-min exec escalation with Tom Ellison (VP Ops) to present Epic fix timeline"
             NOT "schedule a call"
- EVIDENCE-BACKED : cite the exact data point that justifies this action
- SEQUENCED : ordered by urgency and dependency
- MEASURABLE: include a success metric

Output ONLY valid JSON, no markdown."""


async def recommendation_agent(state: AgentState) -> AgentState:
    llm = get_llm()
    customer_name = state["customer_name"]
    analysis = state.get("analysis", {})
    ctx = state.get("customer_context", {})
    ext = state.get("external_intel", {})
    past_recs = state.get("past_recommendations", [])
    logs: list[str] = []

    customer = ctx.get("customer", {})

    # Avoid re-recommending completed actions (memory / learning)
    completed: list[str] = []
    for rec_set in past_recs:
        for action in rec_set.get("recommendations", []):
            if action.get("status") == "completed":
                completed.append(action.get("title", ""))

    completed_note = ""
    if completed:
        completed_note = (
            f"\nAlready completed (DO NOT re-recommend): {', '.join(completed[:5])}"
        )

    prompt = f"""Generate Next Best Actions for: {customer_name}

CUSTOMER:
  ARR: ${customer.get('arr', 0):,}  |  Health: {customer.get('health_score', 'N/A')}/100
  Status: {customer.get('status')}  |  Contract ends: {str(customer.get('contract_end', ''))[:10]}
  Tier: {customer.get('tier')}

RISKS:
{json.dumps(analysis.get('risks', []), indent=2)[:1400]}

OPPORTUNITIES:
{json.dumps(analysis.get('opportunities', []), indent=2)[:900]}

KEY INSIGHTS: {json.dumps(analysis.get('key_insights', []))}
RELATIONSHIP HEALTH: {json.dumps(analysis.get('relationship_health', {}))}

EXTERNAL: {json.dumps(ext.get('summary', ''))[:400]}
HIRING TRENDS: {ext.get('hiring_trends', [])}
{completed_note}

Generate 4-6 prioritised Next Best Actions:
{{
  "recommendations": [
    {{
      "id": "nba-001",
      "rank": 1,
      "title": "Verb + who + specific what",
      "category": "risk-mitigation|expansion|relationship|technical|strategic",
      "urgency": "immediate|this-week|this-month|this-quarter",
      "description": "2-3 sentences on exactly what to do and why",
      "owner": "CSM|Account Executive|Engineering|Executive",
      "deadline_days": 7,
      "confidence": 0.85,
      "confidence_reasoning": "Why this confidence level — cite specific evidence",
      "evidence": [
        {{"source": "meeting_notes|ticket|email|external", "detail": "specific data point"}}
      ],
      "expected_outcome": "Specific measurable result",
      "business_impact": "$ value or risk reduction amount",
      "execution_steps": ["Step 1", "Step 2", "Step 3"],
      "risks_if_not_done": "What happens if skipped",
      "success_metric": "How to know this succeeded"
    }}
  ],
  "executive_summary": "3-4 sentences on situation and recommended posture",
  "total_risk_exposure": "$ at risk or qualitative",
  "total_opportunity_value": "$ potential upside"
}}"""

    response = await llm.ainvoke([
        SystemMessage(content=_SYSTEM),
        HumanMessage(content=prompt),
    ])

    raw = response.content.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1] if len(parts) > 1 else raw
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        result = json.loads(raw)
        recommendations = result.get("recommendations", [])
    except Exception as e:
        recommendations = []
        result = {"executive_summary": f"Parse error: {str(e)[:100]}"}

    logs.append(
        f"[Recommendation] {len(recommendations)} Next Best Actions generated"
    )
    for r in recommendations:
        logs.append(
            f"[Recommendation] #{r.get('rank','?')} "
            f"[{r.get('urgency','?').upper()}] "
            f"{r.get('title','?')} — "
            f"Confidence: {int(r.get('confidence', 0) * 100)}%"
        )

    updated_analysis = {
        **analysis,
        "executive_summary": result.get("executive_summary", ""),
        "total_risk_exposure": result.get("total_risk_exposure", ""),
        "total_opportunity_value": result.get("total_opportunity_value", ""),
    }

    return {
        **state,
        "recommendations": recommendations,
        "analysis": updated_analysis,
        "agent_logs": logs,
    }