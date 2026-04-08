from fastapi import APIRouter
from datetime import datetime, timezone
from app.db.supabase import get_supabase_client

router = APIRouter()


@router.get("/stats")
async def get_stats() -> dict:
    supabase = get_supabase_client()

    customers_resp = (
        supabase.table("customers")
        .select("*", count="exact")
        .limit(1)
        .execute()
    )

    products_resp = (
        supabase.table("products")
        .select("*", count="exact")
        .limit(1)
        .execute()
    )

    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()

    orders_resp = (
        supabase.table("orders")
        .select("total, status", count="exact")
        .gte("created_at", month_start)
        .execute()
    )

    monthly_revenue = sum(
        float(o["total"]) for o in (orders_resp.data or [])
        if o.get("status") not in ("cancelled",)
    )
    pending_count = sum(
        1 for o in (orders_resp.data or [])
        if o.get("status") == "pending"
    )

    return {
        "total_customers": customers_resp.count or 0,
        "total_products": products_resp.count or 0,
        "monthly_revenue": round(monthly_revenue, 2),
        "monthly_orders": orders_resp.count or 0,
        "pending_orders": pending_count,
    }
