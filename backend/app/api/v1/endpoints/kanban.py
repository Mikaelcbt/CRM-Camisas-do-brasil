from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.kanban import CardMove, KanbanCard, KanbanCardCreate
from app.db.supabase import get_supabase_client

router = APIRouter()


@router.get("/cards", response_model=List[KanbanCard])
async def list_cards() -> List[KanbanCard]:
    supabase = get_supabase_client()
    response = (
        supabase.table("kanban_cards")
        .select("*")
        .order("created_at")
        .limit(500)
        .execute()
    )
    return response.data or []


@router.post("/cards", response_model=KanbanCard)
async def create_card(card: KanbanCardCreate) -> KanbanCard:
    supabase = get_supabase_client()
    response = supabase.table("kanban_cards").insert(card.model_dump()).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Error creating card")
    return response.data[0]


@router.delete("/cards/{card_id}")
async def delete_card(card_id: int) -> dict:
    supabase = get_supabase_client()
    response = supabase.table("kanban_cards").delete().eq("id", card_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"message": "Card deleted successfully"}


@router.post("/cards/move")
async def move_card(m: CardMove) -> dict:
    supabase = get_supabase_client()
    response = (
        supabase.table("kanban_cards")
        .update({"status": m.new_status})
        .eq("id", m.card_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"message": "Card moved successfully", "data": response.data[0]}
