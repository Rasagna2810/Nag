from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, VectorParams
from core.config import get_settings

settings = get_settings()
_mongo_client: AsyncIOMotorClient | None = None

def get_mongo_client() -> AsyncIOMotorClient:
    global _mongo_client
    if _mongo_client is None:
        _mongo_client = AsyncIOMotorClient(settings.mongodb_url)
    return _mongo_client

def get_db():
    return get_mongo_client()[settings.mongodb_db]

_qdrant_client: AsyncQdrantClient | None = None

def get_qdrant() -> AsyncQdrantClient:
    global _qdrant_client
    if _qdrant_client is None:
        url = settings.qdrant_url.strip().lower()
        if url in ("memory", ":memory:", ""):
            # In-memory mode — no Docker required
            _qdrant_client = AsyncQdrantClient(location=":memory:")
            print("[Qdrant] Running IN-MEMORY (no server needed)")
        else:
            # Remote server mode
            _qdrant_client = AsyncQdrantClient(url=settings.qdrant_url)
            print(f"[Qdrant] Connecting to {settings.qdrant_url}")
    return _qdrant_client


async def ensure_qdrant_collection() -> None:
    client = get_qdrant()
    try:
        collections = await client.get_collections()
        names = [c.name for c in collections.collections]
        if settings.qdrant_collection not in names:
            await client.create_collection(
                collection_name=settings.qdrant_collection,
                vectors_config=VectorParams(size=384, distance=Distance.COSINE),
            )
            print(f"[Qdrant] Created collection: {settings.qdrant_collection}")
        else:
            print(f"[Qdrant] Collection ready: {settings.qdrant_collection}")
    except Exception as e:
        print(f"[Qdrant] WARNING: {e}")


# ── Seed helpers ──────────────────────────────────────────────

async def _seed_users(db) -> None:
    from core.auth import hash_password
    await db.users.insert_many([
        {
            "email":           "admin@acme.com",
            "name":            "Alex Morgan",
            "role":            "admin",
            "hashed_password": hash_password("demo1234"),
            "avatar":          "AM",
        },
        {
            "email":           "sarah@acme.com",
            "name":            "Sarah Chen",
            "role":            "csm",
            "hashed_password": hash_password("demo1234"),
            "avatar":          "SC",
        },
    ])
    print("[MongoDB] Seeded demo users")


async def _seed_customers(db) -> None:
    now = datetime.utcnow()
    await db.customers.insert_many([
        {
            "name":         "Meridian Healthcare",
            "industry":     "Healthcare",
            "arr":          480000,
            "health_score": 42,
            "tier":         "Enterprise",
            "csm":          "Sarah Chen",
            "contract_end": (now + timedelta(days=45)).isoformat(),
            "status":       "At Risk",
            "contacts": [
                {"name": "Dr. Priya Nair",  "role": "CTO",          "email": "p.nair@meridian.com"},
                {"name": "Tom Ellison",     "role": "VP Operations", "email": "t.ellison@meridian.com"},
            ],
            "tags": ["renewal-risk", "expansion-candidate"],
        },
        {
            "name":         "NovaTech Solutions",
            "industry":     "SaaS",
            "arr":          230000,
            "health_score": 78,
            "tier":         "Growth",
            "csm":          "Sarah Chen",
            "contract_end": (now + timedelta(days=120)).isoformat(),
            "status":       "Healthy",
            "contacts": [
                {"name": "Marcus Webb", "role": "CEO", "email": "m.webb@novatech.com"},
            ],
            "tags": ["upsell-ready"],
        },
        {
            "name":         "Apex Logistics",
            "industry":     "Logistics",
            "arr":          175000,
            "health_score": 61,
            "tier":         "Mid-Market",
            "csm":          "Alex Morgan",
            "contract_end": (now + timedelta(days=200)).isoformat(),
            "status":       "Needs Attention",
            "contacts": [
                {"name": "Linda Park", "role": "COO", "email": "l.park@apex.com"},
            ],
            "tags": ["feature-request-pending"],
        },
    ])
    print("[MongoDB] Seeded demo customers")


async def _seed_interactions(db) -> None:
    now = datetime.utcnow()
    await db.interactions.insert_many([
        {
            "customer_name": "Meridian Healthcare",
            "type":  "meeting_notes",
            "date":  (now - timedelta(days=3)).isoformat(),
            "content": (
                "QBR with Dr. Nair and Tom Ellison. Main concerns: "
                "(1) Integration with Epic EHR is broken since our v3.2 release. "
                "IT team blocked for 2 weeks. "
                "(2) User adoption at 34% vs target of 80%. Onboarding felt rushed. "
                "(3) Contract renewal in 45 days — Tom mentioned evaluating competitors. "
                "Dr. Nair willing to advocate internally IF we fix Epic integration fast."
            ),
            "author": "Sarah Chen",
        },
        {
            "customer_name": "Meridian Healthcare",
            "type":  "support_ticket",
            "date":  (now - timedelta(days=10)).isoformat(),
            "content": (
                "TICKET #4421 — Priority: Critical. "
                "Epic EHR integration returning 503 errors on data sync. "
                "Affects all 12 clinical departments. "
                "Workaround: manual CSV export (unsustainable). "
                "Engineering assigned but no ETA given. Customer extremely frustrated."
            ),
            "author": "Support Team",
        },
        {
            "customer_name": "Meridian Healthcare",
            "type":  "email",
            "date":  (now - timedelta(days=1)).isoformat(),
            "content": (
                "From: t.ellison@meridian.com — Subject: Urgent: Renewal Decision. "
                "Sarah — the board wants a decision by end of month. "
                "The Epic integration issue is a dealbreaker if not resolved. "
                "We also need custom reporting for CMS compliance. "
                "We pay $480K/year and need to justify this to leadership. "
                "Please respond with a concrete plan."
            ),
            "author": "Tom Ellison (Customer)",
        },
        {
            "customer_name": "NovaTech Solutions",
            "type":  "meeting_notes",
            "date":  (now - timedelta(days=7)).isoformat(),
            "content": (
                "Monthly check-in with Marcus. Very positive. "
                "NovaTech grew from 50 to 200 users this quarter — platform performing well. "
                "Marcus asked about enterprise SSO and advanced analytics. "
                "They are hiring 3 new sales reps and will likely need Salesforce CRM integration. "
                "Current plan does not include these features. "
                "Expansion opportunity: ~$80K ACV uplift."
            ),
            "author": "Sarah Chen",
        },
        {
            "customer_name": "Apex Logistics",
            "type":  "email",
            "date":  (now - timedelta(days=14)).isoformat(),
            "content": (
                "From: l.park@apex.com — Subject: Feature request follow-up. "
                "Hi Alex, still waiting on the real-time shipment tracking feature "
                "we discussed in our last QBR. This is blocking our Q1 operational plan. "
                "Can you give me an ETA? Otherwise we may need to look at alternatives."
            ),
            "author": "Linda Park (Customer)",
        },
    ])
    print("[MongoDB] Seeded demo interactions")


async def startup_db() -> None:
    """Called at FastAPI startup."""
    await ensure_qdrant_collection()
    db = get_db()

    if await db.users.count_documents({}) == 0:
        await _seed_users(db)

    if await db.customers.count_documents({}) == 0:
        await _seed_customers(db)

    if await db.interactions.count_documents({}) == 0:
        await _seed_interactions(db)