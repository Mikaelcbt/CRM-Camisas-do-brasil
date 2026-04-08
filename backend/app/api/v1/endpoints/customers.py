from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.customer import CustomerCreate, Customer, CustomerUpdate
from app.db.supabase import get_supabase_client

router = APIRouter()

_MAX_LIMIT = 200


@router.get("/", response_model=List[Customer])
async def list_customers(skip: int = 0, limit: int = 50) -> List[Customer]:
    supabase = get_supabase_client()
    safe_limit = min(limit, _MAX_LIMIT)
    response = supabase.table("customers").select("*").range(skip, skip + safe_limit - 1).execute()
    return response.data or []


@router.get("/{customer_id}", response_model=Customer)
async def get_customer(customer_id: int) -> Customer:
    supabase = get_supabase_client()
    response = supabase.table("customers").select("*").eq("id", customer_id).maybe_single().execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Customer not found")
    return response.data


@router.post("/", response_model=Customer)
async def create_customer(customer: CustomerCreate) -> Customer:
    supabase = get_supabase_client()
    response = supabase.table("customers").insert(customer.model_dump()).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Error creating customer")
    return response.data[0]


@router.put("/{customer_id}", response_model=Customer)
async def update_customer(customer_id: int, customer: CustomerUpdate) -> Customer:
    supabase = get_supabase_client()
    payload = {k: v for k, v in customer.model_dump().items() if v is not None}
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")
    response = supabase.table("customers").update(payload).eq("id", customer_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Customer not found")
    return response.data[0]


@router.delete("/{customer_id}")
async def delete_customer(customer_id: int) -> dict:
    supabase = get_supabase_client()
    response = supabase.table("customers").delete().eq("id", customer_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted successfully"}
