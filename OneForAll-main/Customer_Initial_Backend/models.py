from sqlalchemy import Column,Integer,String,Boolean,TIMESTAMP
from sqlalchemy.sql import func # This is used to get the current timestamp
from database import Base # This is the Base class that we will use to create our models

class User(Base):
    __tablename__="users"
    id=Column(Integer,primary_key=True,index=True)
    phone=Column(String(20),nullable=False)
    email = Column(String(100), unique=True)
    name=Column(String(100),nullable=False)
    password_hash=Column(String(255))
    role=Column(String(20),nullable=False)
    is_active = Column(Boolean, default=True)

    created_at= Column(TIMESTAMP,server_default=func.now()) # This will automatically set the created_at field to the current timestamp when a new record is created
    updated_at= Column(TIMESTAMP,server_default=func.now(),onupdate=func.now()) # This will automatically set the updated_at field to the current timestamp when a record is updated

