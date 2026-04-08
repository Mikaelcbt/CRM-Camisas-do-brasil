import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.api.v1.endpoints import products as products_endpoints
from app.api.v1.endpoints import customers as customers_endpoints
from app.api.v1.endpoints import kanban as kanban_endpoints
from app.api.v1.endpoints import auth as auth_endpoints
from app.api.v1.endpoints import orders as orders_endpoints
from app.api.v1.endpoints import dashboard as dashboard_endpoints

load_dotenv()

app = FastAPI(title="CRM Camisas", version="1.0.0")

_allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _allowed_origins],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_endpoints.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(products_endpoints.router, prefix="/api/v1/products", tags=["products"])
app.include_router(customers_endpoints.router, prefix="/api/v1/customers", tags=["customers"])
app.include_router(kanban_endpoints.router, prefix="/api/v1/kanban", tags=["kanban"])
app.include_router(orders_endpoints.router, prefix="/api/v1/orders", tags=["orders"])
app.include_router(dashboard_endpoints.router, prefix="/api/v1/dashboard", tags=["dashboard"])


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.get("/")
async def root() -> dict:
    return {"message": "CRM Camisas API v1.0"}
