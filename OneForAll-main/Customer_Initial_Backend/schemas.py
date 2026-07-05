from pydantic import BaseModel
from typing import Optional
from enum import Enum

class UserRole(str,Enum):
    customer="customer"
    shopkeeper="shopkeeper"
    admin="admin"

class UserCreate(BaseModel):
    phone:str
    email:str
    name:str
    password:str
    role:UserRole

class UpdateUser(BaseModel):
    phone:Optional[str]=None
    email:Optional[str]=None
    name:Optional[str]=None
    role:Optional[UserRole]=None
    is_active:Optional[bool]=None

class LoginRequest(BaseModel):
    email:str
    password:str