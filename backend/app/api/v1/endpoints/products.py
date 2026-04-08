from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.product import ProductCreate, Product, ProductUpdate
from app.db.supabase import get_supabase_client

router = APIRouter()

_MAX_LIMIT = 200


@router.get("/", response_model=List[Product])
async def list_products(skip: int = 0, limit: int = 50) -> List[Product]:
    supabase = get_supabase_client()
    safe_limit = min(limit, _MAX_LIMIT)
    response = supabase.table("products").select("*").range(skip, skip + safe_limit - 1).execute()
    return response.data or []


@router.get("/{product_id}", response_model=Product)
async def get_product(product_id: int) -> Product:
    supabase = get_supabase_client()
    response = supabase.table("products").select("*").eq("id", product_id).maybe_single().execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Product not found")
    return response.data


@router.post("/", response_model=Product)
async def create_product(product: ProductCreate) -> Product:
    supabase = get_supabase_client()
    response = supabase.table("products").insert(product.model_dump()).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Error creating product")
    return response.data[0]


@router.put("/{product_id}", response_model=Product)
async def update_product(product_id: int, product: ProductUpdate) -> Product:
    supabase = get_supabase_client()
    payload = {k: v for k, v in product.model_dump().items() if v is not None}
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")
    response = supabase.table("products").update(payload).eq("id", product_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Product not found")
    return response.data[0]


@router.delete("/{product_id}")
async def delete_product(product_id: int) -> dict:
    supabase = get_supabase_client()
    response = supabase.table("products").delete().eq("id", product_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}
