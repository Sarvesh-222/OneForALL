from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional

from pydantic import BaseModel


class ShopkeeperRole(str, Enum):
    customer = "customer"
    shopkeeper = "shopkeeper"
    admin = "admin"


class ShopkeeperCreate(BaseModel):
    shop_id: int
    phone: str
    email: str
    name: str
    password: str
    role: ShopkeeperRole = ShopkeeperRole.shopkeeper


class ShopkeeperUpdate(BaseModel):
    shop_id: Optional[int] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    role: Optional[ShopkeeperRole] = None
    is_active: Optional[bool] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class ShopkeeperResponse(BaseModel):
    id: int
    shop_id: int
    phone: str
    email: str
    name: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    shop_id: int = 1
    name: str
    price: Decimal
    stock_quantity: Optional[int] = 10
    is_available: Optional[bool] = None
    emoji: Optional[str] = "📦"
    unit: Optional[str] = "kg"
    image: Optional[str] = None
    quantity: Optional[int] = None
    inStock: Optional[bool] = None


class ProductUpdate(BaseModel):
    shop_id: Optional[int] = None
    name: Optional[str] = None
    price: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    is_available: Optional[bool] = None
    emoji: Optional[str] = None
    unit: Optional[str] = None
    image: Optional[str] = None
    quantity: Optional[int] = None
    inStock: Optional[bool] = None


class ProductResponse(BaseModel):
    id: int
    shop_id: int
    name: str
    price: Decimal
    stock_quantity: int
    is_available: bool
    emoji: str
    unit: str
    image: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
