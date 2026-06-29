import json
from datetime import datetime, timedelta
from langchain_core.messages import HumanMessage, SystemMessage
from models.state import AgentState
from core.llm import get_llm
 
_SYSTEM = """
You are a Senior Customer Success AI Analyst working for a B2B SaaS company.

Your objective is to help Customer Success Managers make better business decisions for an individual customer.

You are NOT a chatbot.

You are an enterprise decision intelligence engine.

Your responsibilities are:

• Analyse customer context.
• Understand customer interactions.
• Use enterprise knowledge when relevant.
• Learn from previous recommendations.
• Identify business risks.
• Identify business opportunities.
• Recommend the Next Best Actions.
• Explain every recommendation with supporting evidence.

Always think like an experienced Customer Success Manager.

Never invent facts.

If evidence is insufficient, explicitly mention the information gap.

Every recommendation must be:

• Evidence-based
• Business-focused
• Actionable
• Measurable
• Realistic
• Supported by customer interactions or enterprise knowledge

Output ONLY valid JSON."""
 
_COMBINED_PROMPT = """Analyse this customer and generate Next Best Actions.
 
=== CUSTOMER ===
{customer_json}
 
=== RECENT INTERACTIONS ({interaction_count} total, newest first) ===
{interactions_text}
 
=== KNOWLEDGE BASE ARTICLES MATCHED ===
{kb_text}
 
=== MEMORY: PAST RECOMMENDATIONS ===
{past_text}
 
=== TODAY'S DATE ===
{today}
 
INSTRUCTIONS:

You are performing a business review for ONE customer.

Your objective is to understand the customer's current business situation by combining:

- CRM information
- Recent customer interactions
- Enterprise Knowledge Base articles
- Previous recommendations and outcomes (memory)

Never assume information that is unavailable.

If evidence is missing,
identify it as an Information Gap instead of guessing.

Do NOT rely on stored health_score or status.

Analyse in this order:

1. CUSTOMER CONTEXT
- Summarise the customer's current business situation.
- Identify important stakeholders.
- Consider ARR, contract timeline and customer tier.

2. INTERACTION ANALYSIS
Review emails, tickets and meeting notes.

Determine:
- recurring issues
- new issues
- customer sentiment
- urgency
- executive involvement
- feature requests
- product adoption
- business blockers

3. KNOWLEDGE BASE REASONING
Use retrieved enterprise knowledge only when relevant.

Reference playbooks or troubleshooting guides whenever they help justify recommendations.

Do NOT invent company processes.

4. MEMORY REASONING

Review previous recommendations.

If a recommendation was:

• completed
→ treat it as resolved unless new evidence shows the problem has returned.

• pending
→ determine whether it should remain active.

• rejected
→ avoid recommending the same action again unless strong new evidence exists.

Increase business urgency when:

- the same issue appears again after completion
- customer repeatedly reports the same issue
- multiple follow-up emails exist
- issue duration is increasing

5. BUSINESS RISK

Identify:

- renewal risk
- churn indicators
- operational risk
- customer relationship risk
- technical risk

Support every risk with evidence.

6. BUSINESS OPPORTUNITIES

Identify:

- expansion opportunities
- upsell potential
- advocacy opportunities
- adoption improvements

Support every opportunity with evidence.

7.Recommendation Prioritization

Assign every recommendation a business priority.

P1
- Business-critical.
- Blocking customer operations.
- Renewal at immediate risk.
- Recurring issue after previous completion.
- Executive escalation required.
- Same unresolved issue reported multiple times.

P2
- Important but not business-critical.
- Feature requests.
- Pending follow-ups.
- Adoption improvements.
- Business Value Reviews.
- Expansion preparation.

P3
- Long-term improvements.
- Training.
- Documentation.
- Future expansion.
- Process optimization.

Priority should be determined using:

- Business impact
- Customer history
- Recommendation memory
- Urgency
- Evidence

8. NEXT BEST ACTIONS

Generate recommendations that:

- are prioritised by business impact
- are actionable
- have clear owners
- include due dates-consider contract timeline and business urgency
- reference and include  supporting evidence
- reference relevant knowledge base guidance where applicable

Never recommend actions already completed unless new evidence indicates the issue has returned.

8. CUSTOMER HEALTH

Finally calculate:

- Health Score
- Status
- Trend

The score should be evidence-based.

Not formula-based.

Health should be an OUTPUT of the analysis, not the starting point.

9. EXECUTIVE SUMMARY

Summarise:

- current customer situation
- major risks
- opportunities
- recommended business posture

Health Score Guidelines

Health Score is an overall indicator of customer relationship quality.

Consider:

• recurring support issues
• executive escalations
• customer sentiment
• feature adoption
• unresolved recommendations
• contract timeline
• business impact
• expansion interest
• successful completion of previous actions

The score should be evidence-based rather than formula-based.

Always explain why the score was assigned.
 
Return this exact JSON structure:
{{
  "calculated_health": {{
    "score": 42,
    "status": "At Risk",
    "trend": "declining|stable|improving",
    "reasoning": "one sentence explaining the score"
  }},
  "risks": [
    {{
      "title": "short title",
      "severity": "critical|high|medium|low",
      "description": "specific description citing data",
      "evidence": "exact quote or data point from interactions",
      "business_impact": "$ or qualitative impact"
    }}
  ],
  "opportunities": [
    {{
      "title": "short title",
      "type": "expansion|renewal|advocacy|upsell",
      "description": "specific opportunity",
      "potential_value": "$ estimate",
      "evidence": "data point supporting this"
    }}
  ],
  "recommendations": [
    {{
      "id": "nba-001",
      "rank": 1,
      "title": "Verb + who + specific action",
      "category": "risk-mitigation|expansion|relationship|technical|strategic",
      "urgency": "immediate|this-week|this-month|this-quarter",
      "priority": "P1|P2|P3",
      "due_date": "2025-01-15",
      "description": "exactly what to do and why in 2-3 sentences",
      "owner": "CSM|Engineering|Account Executive|Executive",
      "expected_outcome": "specific measurable result e.g. Epic integration restored, adoption rises from 34% to 60% in 30 days",
      "business_impact": "$ or risk reduction",
      "evidence": [
        {{"source": "meeting_notes|ticket|email|kb_article", "detail": "specific text"}}
      ],
      "execution_steps": ["Step 1", "Step 2", "Step 3"],
      "risks_if_not_done": "consequence of inaction",
      "success_metric": "how to know it worked"
    }}
  ],
  "key_insights": ["insight 1", "insight 2", "insight 3"],
  "executive_summary": "3-4 sentences covering situation, risk, and recommended posture",
  "total_risk_exposure": "$480K ARR at risk or qualitative",
  "total_opportunity_value": "$80K expansion potential or qualitative"
}}"""
 
 
def _clean_json(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```", 2)[1]
        if raw.startswith("json"):
            raw = raw[4:]
        if raw.endswith("```"):
            raw = raw[:-3]
    return raw.strip()
 
 
async def reasoning_agent(state: AgentState) -> AgentState:
    llm       = get_llm()
    ctx       = state.get("customer_context", {})
    past_recs = state.get("past_recommendations", [])
    logs: list[str] = []
 
    customer     = ctx.get("customer", {})
    interactions = ctx.get("interactions", [])
    kb_articles  = ctx.get("kb_articles", [])
    interaction_lines = []
    for i in interactions[:15]:
        interaction_lines.append(
            f"[{i.get('type','?').upper()} | {str(i.get('date',''))[:10]} | by {i.get('author','?')}]\n"
            f"{i.get('content', '')}"
        )
    interactions_text = "\n\n".join(interaction_lines) if interaction_lines else "No interactions on record."
 
    kb_lines = []
    for a in kb_articles:
        kb_lines.append(f"[{a.get('type','?').upper()}] {a.get('title','')}\n{a.get('content','')[:400]}")
    kb_text = "\n\n".join(kb_lines) if kb_lines else "No KB articles matched."
 
    # ── Past recommendations (memory) ─────────────────────────
    past_lines = []
    for r in past_recs[:2]:
        completed = [a.get("title","") for a in r.get("recommendations",[]) if a.get("todo_status") == "done"]
        past_lines.append(
            f"Analysis from {str(r.get('created_at',''))[:10]}: {r.get('summary','')}\n"
            f"Completed actions: {', '.join(completed) if completed else 'none'}"
        )
    past_text = "\n\n".join(past_lines) if past_lines else "No previous recommendations."
 
    prompt = _COMBINED_PROMPT.format(
        customer_json = json.dumps({
            "name":         customer.get("name"),
            "industry":     customer.get("industry"),
            "arr":          customer.get("arr"),
            "tier":         customer.get("tier"),
            "contract_end": str(customer.get("contract_end",""))[:10],
            "contacts":     customer.get("contacts", []),
        }, indent=2),
        interaction_count = len(interactions),
        interactions_text = interactions_text,
        kb_text           = kb_text,
        past_text         = past_text,
        today             = datetime.utcnow().strftime("%Y-%m-%d"),
    )
 
    logs.append("[Reasoning] Running combined analysis + recommendations (1 Gemini call)...")
 
    response = await llm.ainvoke([
        SystemMessage(content=_SYSTEM),
        HumanMessage(content=prompt),
    ])
 
    raw = _clean_json(response.content)
 
    try:
        result = json.loads(raw)
    except Exception as e:
        logs.append(f"[Reasoning] JSON parse failed: {str(e)[:80]}")
        result = {
            "calculated_health":    {"score": 50, "status": "Unknown", "trend": "stable", "reasoning": "Parse failed"},
            "risks":                [],
            "opportunities":        [],
            "recommendations":      [],
            "key_insights":         ["LLM response parse failed"],
            "executive_summary":    "Analysis failed — check server logs",
            "total_risk_exposure":  "Unknown",
            "total_opportunity_value": "Unknown",
        }
 
    recs   = result.get("recommendations", [])
    risks  = result.get("risks", [])
    opps   = result.get("opportunities", [])
    calc   = result.get("calculated_health", {})
 
    logs.append(f"[Reasoning] Calculated health: {calc.get('score','?')}/100 — {calc.get('status','?')} ({calc.get('trend','?')})")
    logs.append(f"[Reasoning] {len(risks)} risks, {len(opps)} opportunities")
    logs.append(f"[Reasoning] {len(recs)} Next Best Actions generated")
    for r in recs:
        logs.append(
            f"[Reasoning] {r.get('priority','?')} [{r.get('urgency','?').upper()}] "
            f"{r.get('title','?')} — due {r.get('due_date','?')}"
        )
 
    analysis = {
        "calculated_health":      calc,
        "risks":                  risks,
        "opportunities":          opps,
        "key_insights":           result.get("key_insights", []),
        "executive_summary":      result.get("executive_summary", ""),
        "total_risk_exposure":    result.get("total_risk_exposure", ""),
        "total_opportunity_value":result.get("total_opportunity_value", ""),
        "reasoning_summary":      result.get("executive_summary", ""),
        "information_gaps":       [],
        "business_context":       {},
    }
 
    return {
        **state,
        "analysis":        analysis,
        "recommendations": recs,
        "agent_logs":      logs,
    }
 