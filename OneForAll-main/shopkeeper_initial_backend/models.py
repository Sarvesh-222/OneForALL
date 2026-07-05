from sqlalchemy import BIGINT, DECIMAL, Boolean, Column, Integer, String, TIMESTAMP
from sqlalchemy.sql import func

try:
    from .database import Base
except ImportError:  # pragma: no cover - enables direct script execution
    from database import Base


class ShopkeeperUser(Base):
    __tablename__ = "shopkeeper_users"

    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="shopkeeper")
    is_active = Column(Boolean, default=True)

    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, nullable=False, default=1)
    name = Column(String(100), nullable=False)
    price = Column(DECIMAL(10, 2), nullable=False)
    stock_quantity = Column(Integer, default=10)
    is_available = Column(Boolean, default=True)
    emoji = Column(String(20), default="📦")
    unit = Column(String(20), default="kg")
    image = Column(String(500), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class OrderRecord(Base):
    __tablename__ = "shopkeeper_orders"

    id = Column(String(100), primary_key=True, index=True)
    shop_id = Column(Integer, nullable=False, default=1)
    cus_name = Column(String(100), nullable=False)
    items = Column(String(500), nullable=False)
    amount = Column(DECIMAL(10, 2), nullable=False)
    timestamp = Column(BIGINT, nullable=False, default=0)
    status = Column(String(20), nullable=False, default="Pending")
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
