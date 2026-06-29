import json
from langchain_core.messages import HumanMessage, SystemMessage
from models.state import AgentState
from core.llm import get_llm
from core.database import get_db
 
_SYSTEM = """You are the Workflow Planner for a reusable B2B SaaS Customer Success Decision Intelligence Platform.

Your responsibility is ONLY to decide the analysis strategy.

Do NOT perform business reasoning.
Do NOT generate recommendations.
Do NOT generate knowledge base search queries.

The Internal Knowledge Agent will retrieve enterprise knowledge.
The Reasoning Agent will analyze the customer.
The Recommendation Agent will generate next best actions.

Return ONLY valid JSON:

{
  "needs_kb_search": true,
  "kb_query": "specific search query for internal knowledge",
  "priority": "high|medium|low",
  "focus": "renewal|expansion|health|technical|escalation",
  "rationale": "One sentence explaining the workflow decision."
}

Decision Rules:

needs_kb_search = true when:

- Technical issues require troubleshooting guidance.
- Customer interactions mention product functionality.
- Internal playbooks may help decision making.
- Business processes (renewal, onboarding, expansion, escalation) require company-specific guidance.

Rules for kb_query — be SPECIFIC, include:
  - Product names / integrations mentioned (Epic, Salesforce, SSO)
  - Problem type (integration failure, low adoption, renewal risk)
  - Industry (healthcare, logistics, SaaS)
  - Urgency signal (45 days, critical, at risk)

Priority Rules

HIGH Priority
- The same critical issue has occurred again after being marked as completed.
- Customer has reported the same issue multiple times within the last 60 days.
- Customer has sent multiple follow-up emails without satisfactory resolution.
- Contract renewal is within 45 days and unresolved business-critical issues exist.
- Executive stakeholders (CTO, CEO, VP, etc.) are involved in escalations.
- Previous recommendations related to this issue were rejected or not completed.
- The issue is blocking the customer's business operations.

MEDIUM Priority
- New issue reported for the first time.
- Feature request has been pending for more than 30 days.
- Customer requested product improvements or roadmap updates.
- Contract renewal is within 45–90 days.
- Previous recommendations are still pending.
- Customer reports moderate dissatisfaction but business operations continue normally.

LOW Priority
- Previous recommendations have been completed successfully.
- No recurring issues are found.
- Customer interactions are mostly positive.
- Customer is requesting information or minor enhancements.
- Renewal is more than 90 days away.
- No unresolved critical tickets or escalations exist.

focus:
Choose ONE primary business objective:
- renewal
- expansion
- health
- technical
- escalation

Output JSON only."""
 
 
async def planner_agent(state: AgentState) -> AgentState:
    llm           = get_llm()
    customer_name = state["customer_name"]
    customer_id   = state["customer_id"]
    db            = get_db()
    logs: list[str] = []
 
    from bson import ObjectId
    try:
        oid      = ObjectId(customer_id)
        customer = await db.customers.find_one({"_id": oid})
    except Exception:
        customer = await db.customers.find_one({"name": customer_name})
 
    if not customer:
        customer = {}
 
    recent = await db.interactions.find(
        {"customer_name": customer_name}
    ).sort("date", -1).limit(3).to_list(length=3)
 
    recent_snippets = " | ".join(
        i.get("content", "")[:150] for i in recent
    )
 
    from datetime import datetime
    contract_end  = customer.get("contract_end", "")
    days_to_renewal = None
    if contract_end:
        try:
            end_dt          = datetime.fromisoformat(contract_end[:10])
            days_to_renewal = (end_dt - datetime.utcnow()).days
        except Exception:
            pass
    past     = state.get("past_recommendations", [])
    past_note = ""
    if past:
        last      = past[-1]
        past_note = f"\nPrevious analysis: {last.get('summary', 'N/A')}"
    prompt = f"""Plan the analysis strategy for this customer:
 
Customer: {customer_name}
Industry: {customer.get('industry', 'Unknown')}
ARR: ${customer.get('arr', 0):,}
Health Score: {customer.get('health_score', 'Unknown')}/100
Status: {customer.get('status', 'Unknown')}
Tier: {customer.get('tier', 'Unknown')}
Days to Contract Renewal: {days_to_renewal if days_to_renewal is not None else 'Unknown'}
Tags: {', '.join(customer.get('tags', []))}
 
Recent interactions (last 3):
{recent_snippets if recent_snippets else 'No recent interactions'}
{past_note}
 
Generate the analysis strategy JSON."""
 
    logs.append(f"[Planner] CRM loaded —  Days to renewal: {days_to_renewal}, ARR: ${customer.get('arr',0):,}")
 
    response = await llm.ainvoke([
        SystemMessage(content=_SYSTEM),
        HumanMessage(content=prompt),
    ])
 
    raw = response.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()
 
    try:
        plan = json.loads(raw)
    except Exception:
        hs   = customer.get("health_score", 100)
        dtr  = days_to_renewal or 999
        tags = customer.get("tags", [])
        plan = {
            "needs_kb_search": hs < 70 or dtr < 90 or "renewal-risk" in tags,
            "kb_query":        f"{customer_name} {customer.get('industry','')} renewal risk integration",
            "priority":        "high" if (hs < 50 or dtr < 45) else "medium" if (hs < 70 or dtr < 90) else "low",
            "focus":           "renewal" if dtr < 90 else "health",
            "rationale":       "Derived from CRM data (JSON parse failed)",
        }
 
    pipeline = ["internal_knowledge", "reasoning", "report"]
 
    logs.append(f"[Planner] Strategy: {plan.get('focus','?').upper()} | Priority: {plan.get('priority','?').upper()}")
    logs.append(f"[Planner] KB search: {plan.get('needs_kb_search')} — query: \"{plan.get('kb_query','')}\"")
    logs.append(f"[Planner] Pipeline: {' → '.join(pipeline)}")
    logs.append(f"[Planner] Rationale: {plan.get('rationale','')}")
 
    return {
        **state,
        "plan":         pipeline,
        "current_step": 0,
        "status":       "running",
        "agent_logs":   logs,
        "customer_context": {
            **state.get("customer_context", {}),
            "kb_query":        plan.get("kb_query", customer_name),
            "needs_kb_search": plan.get("needs_kb_search", True),
            "plan_focus":      plan.get("focus", "health"),
            "plan_priority":   plan.get("priority", "medium"),
            "customer":        {**customer, "_id": str(customer.get("_id", ""))},
            "days_to_renewal": days_to_renewal,
        },
    }
 