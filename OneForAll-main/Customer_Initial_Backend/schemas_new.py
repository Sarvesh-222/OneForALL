from decimal import Decimal
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProductCreate(BaseModel):
    shop_id:int
    name:str
    price:Decimal
    stock_quantity:Optional[int] = 10
    is_available:Optional[bool] = None
    
class UpdateProduct(BaseModel):
    shop_id:Optional[int] = None
    name:Optional[str] = None
    price:Optional[Decimal] = None
    stock_quantity:Optional[int] = None
    is_available:Optional[bool] = None

#Data returned to frontend
class ProductResponse(BaseModel):
    id:int
    shop_id:int
    name:str
    price:Decimal
    stock_quantity:int
    is_available:bool
    created_at:datetime
    updated_at:datetime

    class Config: # This is used to tell Pydantic that we want to use the ORM mode, which means that we can use the SQLAlchemy models directly and Pydantic will convert them to the response model
        from_attributes=True