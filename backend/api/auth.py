from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from core.database import get_db
from core.auth import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    db = get_db()
    user = await db.users.find_one({"email": body.email})
    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    token = create_access_token({"sub": user["email"]})
    user_out = {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "avatar": user.get("avatar", user["name"][:2].upper()),
    }
    return LoginResponse(access_token=token, user=user_out)


@router.get("/me")
async def me_route(current_user: dict = Depends(get_current_user)):
    return current_user