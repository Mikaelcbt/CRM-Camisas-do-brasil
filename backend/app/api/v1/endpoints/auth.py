from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from app.db.supabase import get_supabase_client

router = APIRouter()


class UserCredentials(BaseModel):
    email: EmailStr
    password: str


@router.post("/register")
async def register(credentials: UserCredentials) -> dict:
    supabase = get_supabase_client()
    try:
        res = supabase.auth.sign_up({
            "email": credentials.email,
            "password": credentials.password,
        })
        return {"message": "User registered successfully", "user_id": res.user.id if res.user else None}
    except Exception:
        raise HTTPException(status_code=400, detail="Registration failed. Email may already be in use.")


@router.post("/login")
async def login(credentials: UserCredentials) -> dict:
    supabase = get_supabase_client()
    try:
        res = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password,
        })
        return {"session": res.session, "user": res.user}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid credentials.")
