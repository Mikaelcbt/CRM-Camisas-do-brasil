from pydantic import BaseModel, ConfigDict
from typing import Optional, List

class Address(BaseModel):
    street: str
    city: str
    state: str
    country: str
    zip_code: str

class CustomerBase(BaseModel):
    full_name: str
    phone: str
    email: Optional[str] = None
    cpf: Optional[str] = None
    address: Optional[Address] = None
    preferences: Optional[dict] = None
    tags: Optional[List[str]] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(CustomerBase):
    full_name: Optional[str] = None
    phone: Optional[str] = None

class Customer(CustomerBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
