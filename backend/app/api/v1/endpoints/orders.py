from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.order import Order, OrderCreate, OrderUpdate
from app.db.supabase import get_supabase_client

router = APIRouter()

_MAX_LIMIT = 200


@router.get("/", response_model=List[Order])
async def list_orders(skip: int = 0, limit: int = 50) -> List[Order]:
    supabase = get_supabase_client()
    safe_limit = min(limit, _MAX_LIMIT)
    orders_resp = (
        supabase.table("orders")
        .select("*, order_items(*), customers(full_name)")
        .range(skip, skip + safe_limit - 1)
        .order("created_at", desc=True)
        .execute()
    )
    result = []
    for row in (orders_resp.data or []):
        customer_info = row.pop("customers", None)
        row["customer_name"] = customer_info["full_name"] if customer_info else None
        row["items"] = row.pop("order_items", [])
        result.append(row)
    return result


@router.get("/{order_id}", response_model=Order)
async def get_order(order_id: int) -> Order:
    supabase = get_supabase_client()
    resp = (
        supabase.table("orders")
        .select("*, order_items(*), customers(full_name)")
        .eq("id", order_id)
        .maybe_single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Order not found")
    row = resp.data
    customer_info = row.pop("customers", None)
    row["customer_name"] = customer_info["full_name"] if customer_info else None
    row["items"] = row.pop("order_items", [])
    return row


@router.post("/", response_model=Order)
async def create_order(order: OrderCreate) -> Order:
    supabase = get_supabase_client()

    total = sum(item.quantity * item.unit_price for item in order.items)

    order_resp = (
        supabase.table("orders")
        .insert({
            "customer_id": order.customer_id,
            "status": order.status,
            "notes": order.notes,
            "total": round(total, 2),
        })
        .execute()
    )
    if not order_resp.data:
        raise HTTPException(status_code=400, detail="Error creating order")

    created_order = order_resp.data[0]
    order_id = created_order["id"]

    items_payload = [
        {
            "order_id": order_id,
            "product_id": item.product_id,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
        }
        for item in order.items
    ]
    items_resp = supabase.table("order_items").insert(items_payload).execute()

    created_order["items"] = items_resp.data or []
    created_order["customer_name"] = None
    return created_order


@router.put("/{order_id}", response_model=Order)
async def update_order(order_id: int, update: OrderUpdate) -> Order:
    supabase = get_supabase_client()
    payload = {k: v for k, v in update.model_dump().items() if v is not None}
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")

    resp = supabase.table("orders").update(payload).eq("id", order_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Order not found")

    return await get_order(order_id)


@router.delete("/{order_id}")
async def delete_order(order_id: int) -> dict:
    supabase = get_supabase_client()
    resp = supabase.table("orders").delete().eq("id", order_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order deleted successfully"}
