from pydantic import BaseModel, ConfigDict
from typing import Optional

class ProductBase(BaseModel):
    name: str
    normal_price: float

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    name: Optional[str] = None
    normal_price: Optional[float] = None

class Product(ProductBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
