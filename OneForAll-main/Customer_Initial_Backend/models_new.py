from sqlalchemy import DECIMAL, Column,Integer,String,Boolean,TIMESTAMP
from sqlalchemy.sql import func # This is used to get the current timestamp
from database import Base # This is the Base class that we will use to create our models

class Product(Base):
    __tablename__="products"
    id=Column(Integer,primary_key=True,index=True)
    shop_id=Column(Integer,nullable=False)
    name=Column(String(100),nullable=False)
    price=Column(DECIMAL(10,2),nullable=False)
    stock_quantity=Column(Integer,default=10)
    is_available = Column(Boolean, default=True)
    created_at= Column(TIMESTAMP,server_default=func.now()) # This will automatically set the created_at field to the current timestamp when a new record is created
    updated_at= Column(TIMESTAMP,server_default=func.now(),onupdate=func.now()) # This will automatically set the updated_at field to the current timestamp when a record is updated
