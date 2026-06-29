from datetime import datetime
from models.state import AgentState


async def report_agent(state: AgentState) -> AgentState:
    customer_name   = state["customer_name"]
    customer        = state.get("customer_context", {}).get("customer", {})
    analysis        = state.get("analysis", {})
    recommendations = state.get("recommendations", [])
    logs: list[str] = []
    print(f"[Report] Received {len(recommendations)} recommendations from state")
    print(f"[Report] State keys: {list(state.keys())}")

    immediate   = [r for r in recommendations if r.get("urgency") == "immediate"]
    high_conf   = [r for r in recommendations if r.get("confidence", 0) >= 0.75]

    slug = customer_name.lower().replace(" ", "-")
    ts   = datetime.utcnow().strftime("%Y%m%d%H%M")

    report: dict = {
        "id":           f"report-{slug}-{ts}",
        "customer_name": customer_name,
        "customer_id":  state["customer_id"],
        "generated_at": datetime.utcnow().isoformat(),
        "generated_by": state.get("user_email", "system"),
        "status":       "awaiting_approval",

        # Summary card
        "executive_summary": {
            "headline":          analysis.get("executive_summary", ""),
            "health_score":      customer.get("health_score", 0),
            "health_trend":      analysis.get("relationship_health", {}).get("trend", "stable"),
            "arr":               customer.get("arr", 0),
            "contract_end":      customer.get("contract_end", ""),
            "tier":              customer.get("tier", ""),
            "status":            customer.get("status", ""),
            "risk_exposure":     analysis.get("total_risk_exposure", ""),
            "opportunity_value": analysis.get("total_opportunity_value", ""),
        },

        # Analysis
        "risks":            analysis.get("risks", []),
        "opportunities":    analysis.get("opportunities", []),
        "key_insights":     analysis.get("key_insights", []),
        "information_gaps": analysis.get("information_gaps", []),
        "reasoning_summary":analysis.get("reasoning_summary", ""),

        # External intel disabled
        "external_intelligence": {"note": "External research disabled to conserve API quota"},

        # Recommendations (HITL gate)
        "recommendations": recommendations,
        "recommendation_stats": {
            "total":           len(recommendations),
            "immediate":       len(immediate),
            "high_confidence": len(high_conf),
            "categories":      list({r.get("category", "") for r in recommendations}),
        },

        # Metadata
        "agents_run":      state.get("plan", []),
        "agent_logs":      state.get("agent_logs", []),
        "workflow_errors": state.get("errors", []),
    }

    logs.append(f"[Report] Assembled: {report['id']}")
    logs.append(
        f"[Report] {len(recommendations)} recommendations "
        f"({len(immediate)} immediate, {len(high_conf)} high-confidence)"
    )
    logs.append("[Report] Status → AWAITING HUMAN APPROVAL")

    return {
        **state,
        "report":  report,
        "status":  "awaiting_approval",
        "agent_logs": logs,
    }