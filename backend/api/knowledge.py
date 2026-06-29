import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from qdrant_client.models import PointStruct, PointIdsList, Distance, VectorParams
from core.auth import get_current_user
from core.config import get_settings
from core.database import get_qdrant
from core.llm import embed_text

router   = APIRouter(prefix="/knowledge", tags=["knowledge"])
settings = get_settings()


class KnowledgeArticle(BaseModel):
    title:   str
    content: str
    type:    str = "article"  

@router.get("/articles")
async def list_articles(user=Depends(get_current_user)):
    """Return every article stored in Qdrant (uses scroll, no query vector needed)."""
    qdrant = get_qdrant()
    try:
        results, _ = await qdrant.scroll(
            collection_name=settings.qdrant_collection,
            limit=100,
            with_payload=True,
            with_vectors=False,
        )
        return {
            "count": len(results),
            "articles": [
                {
                    "id":      str(r.id),
                    "title":   r.payload.get("title", "Untitled"),
                    "content": r.payload.get("content", "")[:500],
                    "type":    r.payload.get("type", "article"),
                }
                for r in results
            ],
        }
    except Exception as e:
        return {"count": 0, "articles": [], "error": str(e)}


@router.post("/ingest")
async def ingest_article(article: KnowledgeArticle, user=Depends(get_current_user)):
    """
    Embed title + content → 384-dim vector → store in Qdrant.
    This article will be retrieved during customer analysis when the Planner's
    kb_query has cosine similarity >= 0.25 with this vector.
    """
    qdrant     = get_qdrant()
    article_id = str(uuid.uuid4())
    vector     = embed_text(f"{article.title}\n{article.content}")

    await qdrant.upsert(
        collection_name=settings.qdrant_collection,
        points=[
            PointStruct(
                id      = article_id,
                vector  = vector,
                payload = {
                    "title":   article.title,
                    "content": article.content[:2000],
                    "type":    article.type,
                },
            )
        ],
    )
    return {
        "status":     "ingested",
        "id":         article_id,
        "title":      article.title,
        "type":       article.type,
        "vector_dim": len(vector),
    }


@router.get("/search")
async def search_knowledge(q: str, limit: int = 5, user=Depends(get_current_user)):
    """
    Same search the Internal Knowledge agent runs during analysis.
    score_threshold=0.2 here (agent uses 0.25 — slightly stricter).
    """
    qdrant  = get_qdrant()
    vector  = embed_text(q)
    results = await qdrant.search(
        collection_name=settings.qdrant_collection,
        query_vector=vector,
        limit=limit,
        score_threshold=0.2,
        with_payload=True,
    )
    return [
        {
            "id":      str(r.id),
            "title":   r.payload.get("title"),
            "content": r.payload.get("content", "")[:400],
            "type":    r.payload.get("type"),
            "score":   round(r.score, 3),
        }
        for r in results
    ]


@router.delete("/articles/{article_id}")
async def delete_article(article_id: str, user=Depends(get_current_user)):
    """Delete one article by UUID. It will never appear in future analyses."""
    qdrant = get_qdrant()
    await qdrant.delete(
        collection_name=settings.qdrant_collection,
        points_selector=PointIdsList(points=[article_id]),
    )
    return {"status": "deleted", "id": article_id}



@router.delete("/articles")
async def delete_all_articles(user=Depends(get_current_user)):
    """Wipe and recreate the Qdrant collection empty."""
    qdrant = get_qdrant()
    await qdrant.delete_collection(collection_name=settings.qdrant_collection)
    await qdrant.create_collection(
        collection_name=settings.qdrant_collection,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE),
    )
    return {"status": "cleared"}

@router.post("/seed")
async def seed_knowledge_base(user=Depends(get_current_user)):
    """Load 5 starter articles that directly improve analysis quality."""
    articles_data = [
        KnowledgeArticle(
           title="Epic EHR Integration Recovery Guide",
            content=(
        "Use this guide when healthcare customers experience Epic EHR integration failures.\n\n"
        "Symptoms:\n"
        "- HTTP 503 API errors\n"
        "- Appointment synchronization delays\n"
        "- Patient scheduling failures\n\n"
        "Resolution Steps:\n"
        "1. Verify Epic API credentials with customer IT.\n"
        "2. Validate FHIR endpoint connectivity.\n"
        "3. Apply compatibility patch KB-2024-092.\n"
        "4. Execute end-to-end integration testing.\n"
        "5. Schedule a validation session with the customer.\n\n"
        "If unresolved after 48 hours, escalate to Engineering."
         )     
        ),
        KnowledgeArticle(
    title="Renewal Risk Management Playbook",
    content=(
        "Use this playbook when an enterprise customer shows renewal risk.\n\n"
        "Indicators:\n"
        "- Renewal within 60 days\n"
        "- Customer mentions competitors\n"
        "- Repeated critical support issues\n"
        "- Executive dissatisfaction\n\n"
        "Recommended actions:\n"
        "1. Assign Executive Sponsor.\n"
        "2. Schedule Business Value Review.\n"
        "3. Share recovery roadmap.\n"
        "4. Hold weekly customer updates.\n"
        "5. Prepare renewal proposal after technical issues are resolved."
    )
          
        ),
    KnowledgeArticle(
    title="Enterprise Expansion Opportunity Guide",
    content=(
        "Expansion opportunities are usually identified when:\n"
        "- Product adoption increases.\n"
        "- Additional departments begin using the platform.\n"
        "- Customer requests new modules.\n"
        "- Business growth requires additional licenses.\n\n"
        "Recommended actions:\n"
        "Conduct discovery meeting.\n"
        "Schedule tailored product demonstration.\n"
        "Prepare commercial proposal.\n"
        "Coordinate implementation plan."
    )
)   ,
KnowledgeArticle(
    title="Customer Adoption Best Practices",
    content=(
        "Healthy adoption reduces churn.\n\n"
        "Best practices:\n"
        "- Deliver onboarding sessions.\n"
        "- Train department champions.\n"
        "- Monitor feature usage.\n"
        "- Review adoption monthly.\n"
        "- Share product updates with stakeholders.\n\n"
        "Low adoption often indicates training gaps rather than product issues."
    )
)    ,
     KnowledgeArticle(
    title="Executive Escalation Procedure",
    content=(
        "Escalate enterprise customers when:\n"
        "- Critical issues remain unresolved.\n"
        "- Renewal is approaching.\n"
        "- Executive stakeholders request intervention.\n\n"
        "Escalation process:\n"
        "1. Notify Customer Success Director.\n"
        "2. Assign Executive Sponsor.\n"
        "3. Create cross-functional action plan.\n"
        "4. Schedule executive review meeting.\n"
        "5. Monitor progress until customer confirms resolution."
    )
)]
    results = []
    for a in articles_data:
        r = await ingest_article(a, user)
        results.append(r)

    return {"status": "seeded", "count": len(results)}