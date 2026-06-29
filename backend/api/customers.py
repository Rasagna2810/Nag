from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from core.auth import get_current_user
from core.database import get_db

router = APIRouter(prefix="/customers", tags=["customers"])


def _ser(doc: dict) -> dict:
    """Stringify MongoDB _id and rename to id."""
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc


def _oid(value: str) -> ObjectId | None:
    try:
        return ObjectId(value)
    except Exception:
        return None


@router.get("/")
async def list_customers(user=Depends(get_current_user)):
    db        = get_db()
    customers = await db.customers.find({}).sort("health_score", 1).to_list(length=100)
    return [_ser(c) for c in customers]


@router.get("/{customer_id}")
async def get_customer(customer_id: str, user=Depends(get_current_user)):
    db       = get_db()
    oid      = _oid(customer_id)
    customer = (
        await db.customers.find_one({"_id": oid})
        if oid
        else await db.customers.find_one({"name": customer_id})
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return _ser(customer)


@router.get("/{customer_id}/interactions")
async def get_interactions(customer_id: str, user=Depends(get_current_user)):
    db       = get_db()
    oid      = _oid(customer_id)
    customer = (
        await db.customers.find_one({"_id": oid})
        if oid
        else await db.customers.find_one({"name": customer_id})
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    items = (
        await db.interactions.find({"customer_name": customer["name"]})
        .sort("date", -1)
        .limit(50)
        .to_list(length=50)
    )
    return [_ser(i) for i in items]


@router.post("/{customer_id}/interactions")
async def add_interaction(
    customer_id: str, body: dict, user=Depends(get_current_user)
):
    db  = get_db()
    oid = _oid(customer_id)
    customer = (
        await db.customers.find_one({"_id": oid})
        if oid
        else await db.customers.find_one({"name": customer_id})
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    doc = {
        "customer_name": customer["name"],
        "type":          body.get("type", "note"),
        "content":       body.get("content", ""),
        "date":          datetime.utcnow().isoformat(),
        "author":        user.get("name", user.get("email", "unknown")),
    }
    result = await db.interactions.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc