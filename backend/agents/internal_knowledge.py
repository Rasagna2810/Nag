from core.database import get_db, get_qdrant
from core.llm import embed_text
from core.config import get_settings
from models.state import AgentState
 
settings = get_settings()
 
 
async def internal_knowledge_agent(state: AgentState) -> AgentState:
    customer_name = state["customer_name"]
    ctx           = state.get("customer_context", {})
    kb_query      = ctx.get("kb_query", customer_name)
    needs_kb      = ctx.get("needs_kb_search", True)
    db            = get_db()
    qdrant        = get_qdrant()
    logs: list[str] = []
 
    customer = ctx.get("customer", {})
    if not customer:
        # Fallback: Planner didn't pre-fetch (shouldn't happen)
        customer = await db.customers.find_one({"name": customer_name}) or {}
        if "_id" in customer:
            customer["_id"] = str(customer["_id"])
        logs.append("[InternalKnowledge] CRM fetched (Planner pre-fetch missed)")
    else:
        logs.append(
            f"[InternalKnowledge] CRM reused from Planner — "
            f"ARR: ${customer.get('arr',0):,} | "
            f"Industry: {customer.get('industry','Unknown')} | "
            f"Tier: {customer.get('tier','Unknown')} | "
            f"Contract End: {str(customer.get('contract_end',''))[:10]}"
            )
 
    raw = (
        await db.interactions.find({"customer_name": customer_name})
        .sort("date", -1)
        .limit(20)
        .to_list(length=20)
    )
    interactions = []
    for i in raw:
        i["_id"] = str(i["_id"])
        interactions.append(i)
 
    # Break down by type for logging
    by_type: dict[str, int] = {}
    for i in interactions:
        t = i.get("type", "unknown")
        by_type[t] = by_type.get(t, 0) + 1
    type_summary = ", ".join(f"{v} {k}" for k, v in by_type.items())
    logs.append(f"[InternalKnowledge] {len(interactions)} interactions: {type_summary}")
 
    raw_past = (
        await db.recommendations.find({"customer_name": customer_name})
        .sort("created_at", -1)
        .limit(3)
        .to_list(length=3)
    )
    past_recs: list[dict] = []
    for r in raw_past:
        r["_id"] = str(r["_id"])
        past_recs.append(r)
 
    if past_recs:
        completed_total = sum(
            1 for r in past_recs
            for a in r.get("recommendations", [])
            if a.get("status") == "completed"
        )
        logs.append(
            f"[InternalKnowledge] {len(past_recs)} past analyses in memory — "
            f"{completed_total} actions previously completed"
        )
    else:
        logs.append("[InternalKnowledge] No past analyses — first run for this customer")
 
    kb_articles: list[dict] = []
    if needs_kb:
        try:
            vector  = embed_text(kb_query)
            results = await qdrant.search(
                collection_name=settings.qdrant_collection,
                query_vector=vector,
                limit=4,
                score_threshold=0.25,
                with_payload=True,
            )
            kb_articles = [
                {
                    "title":   r.payload.get("title", "Untitled"),
                    "content": r.payload.get("content", "")[:600],
                    "type":    r.payload.get("type", "article"),
                    "score":   round(r.score, 3),
                }
                for r in results
            ]
 
            if kb_articles:
                for a in kb_articles:
                    logs.append(
                        f"[InternalKnowledge] KB match: \"{a['title']}\" "
                        f"({a['type']}, score={a['score']})"
                    )
            else:
                logs.append(
                    f"[InternalKnowledge] No KB articles above 0.25 threshold "
                    f"for query: \"{kb_query[:60]}\"\n"
                    "  → Seed the Knowledge Base for grounded recommendations"
                )
        except Exception as e:
            logs.append(f"[InternalKnowledge] Qdrant error: {str(e)[:80]}")
    else:
        logs.append(
            f"[InternalKnowledge] KB search skipped by Planner "
            f"(health {customer.get('health_score','?')}/100, low risk account)"
        )
 
    return {
        **state,
        "customer_context": {
            **ctx,
            "customer":           customer,
            "interactions":       interactions,
            "kb_articles":        kb_articles,
            "past_recommendations": past_recs,
            "kb_query":           kb_query,
            "needs_kb_search":    needs_kb,
        },
        "past_recommendations": past_recs,
        "external_intel":       {},
        "agent_logs":           logs,
    }