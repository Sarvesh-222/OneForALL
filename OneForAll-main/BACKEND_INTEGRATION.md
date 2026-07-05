# Backend Integration Developer Guide (Python FastAPI)

This guide is designed for your backend developer to easily integrate a Python FastAPI backend with the FreshMart Shopkeeper Dashboard.

## 📂 Code Structure Overview
The prototype dashboard has been restructured from a single-file template into a clean, modular structure:
1. [shopkeeper.html](file:///c:/oneForAll/shopkeeper.html) - Pure HTML skeleton, modal interfaces, and structure.
2. [shopkeeper.css](file:///c:/oneForAll/shopkeeper.css) - Extracted dashboard stylings, micro-animations, and modal layout tokens.
3. [shopkeeper.js](file:///c:/oneForAll/shopkeeper.js) - Application logic, state management, and the `ApiService` connector.

## 🚀 How to Enable the Backend
By default, the dashboard runs in mock mode using `localStorage` for state persistence:
- Inside [shopkeeper.js](file:///c:/oneForAll/shopkeeper.js), locate the first line:
  ```javascript
  const USE_MOCK_API = true;
  ```
- Change it to `false` to redirect all dashboard requests from `localStorage` to your Python FastAPI backend endpoints:
  ```javascript
  const USE_MOCK_API = false;
  ```

---

## 🛰️ API Endpoint Contracts

All endpoints expect and return JSON payloads. The base URL is configured as `/api/v1` (appended to your server address).

### 1. Inventory Endpoints

#### `GET /api/v1/inventory`
- **Description**: Fetch the entire product catalogue.
- **Response Payload** (`200 OK`):
  ```json
  [
    {
      "id": 1,
      "name": "Milk",
      "price": 40.0,
      "emoji": "🥛",
      "quantity": 50.0,
      "unit": "litre",
      "inStock": true
    }
  ]
  ```

#### `POST /api/v1/inventory`
- **Description**: Add a new item to the catalogue.
- **Request Payload**:
  ```json
  {
    "name": "Tomatoes",
    "price": 30.0,
    "emoji": "🍅",
    "quantity": 15.0,
    "unit": "kg",
    "inStock": true
  }
  ```
- **Response Payload** (`201 Created`): Returns the created item, including its database-generated `id`.

#### `PUT /api/v1/inventory/{id}`
- **Description**: Edit an existing product.
- **Request Payload** (Partial updates supported):
  ```json
  {
    "name": "Fresh Organic Milk",
    "price": 45.0,
    "quantity": 42.0,
    "unit": "litre",
    "emoji": "🥛",
    "inStock": true
  }
  ```
- **Response Payload** (`200 OK`): Returns the updated item object.

#### `DELETE /api/v1/inventory/{id}`
- **Description**: Remove a product from the database.
- **Response Payload** (`200 OK` or `204 No Content`).

---

### 2. Orders Endpoints

#### `GET /api/v1/orders`
- **Description**: Retrieves all orders received.
- **Response Payload** (`200 OK`):
  ```json
  [
    {
      "id": "ORD-001",
      "cusName": "Rajesh Patel",
      "items": ["Milk", "Bread", "Eggs"],
      "amount": 135.0,
      "timestamp": 1717672200000,
      "status": "Delivered"
    }
  ]
  ```

#### `POST /api/v1/orders`
- **Description**: Creates a new order (primarily triggered by the customer app or simulation).
- **Request Payload**:
  ```json
  {
    "id": "ORD-007",
    "cusName": "Neha Desai",
    "items": ["Tea", "Bread"],
    "amount": 155.0,
    "timestamp": 1717675800000,
    "status": "Pending"
  }
  ```
- **Response Payload** (`201 Created`).

#### `PUT /api/v1/orders/{id}/status`
- **Description**: Update the status of an active order (e.g. Accept, Reject, Deliver).
- **Request Payload**:
  ```json
  {
    "status": "Accepted"
  }
  ```
  *Allowed status values*: `"Pending"`, `"Accepted"`, `"Delivered"`, `"Rejected"`.
- **Response Payload** (`200 OK`): Returns the updated order object.

---

## 🐍 Python FastAPI Backend Template (`main.py`)

Here is a ready-to-use template that your friend can copy-paste to spin up a fully functioning backend with database support (using SQLite). It includes the correct models, schemas, and **CORS configuration** (so the HTML file can query the API even if running on a different port).

To run this backend:
1. Install requirements: `pip install fastapi uvicorn sqlalchemy pydantic`
2. Save the code below to `main.py`
3. Run the server: `uvicorn main:app --reload --port 8000`

```python
import time
from typing import List, Optional
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# SQLAlchemy Setup
DATABASE_URL = "sqlite:///./freshmart.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ─── DATABASE MODELS ───
class DbInventoryItem(Base):
    __tablename__ = "inventory"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    emoji = Column(String, nullable=False)
    quantity = Column(Float, nullable=False, default=0.0)
    unit = Column(String, nullable=False, default="kg")
    in_stock = Column(Boolean, nullable=False, default=True)

class DbOrder(Base):
    __tablename__ = "orders"
    
    id = Column(String, primary_key=True, index=True)
    cus_name = Column(String, nullable=False)
    items = Column(String, nullable=False)  # Stored as comma-separated string
    amount = Column(Float, nullable=False)
    timestamp = Column(Float, nullable=False)  # Millisecond epoch timestamp
    status = Column(String, nullable=False, default="Pending")

# Create tables
Base.metadata.create_all(bind=engine)

# FastAPI App Initialisation
app = FastAPI(
    title="FreshMart - Backend API",
    version="1.0.0",
    docs_url="/docs"
)

# CORS Configuration (allows frontend HTML files to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Session Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ─── PYDANTIC SCHEMAS ───
class InventoryItemBase(BaseModel):
    name: str
    price: float
    emoji: str
    quantity: float
    unit: str
    inStock: bool = Field(default=True, alias="inStock")

    class Config:
        populate_by_name = True

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItem(InventoryItemBase):
    id: int

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    id: str
    cusName: str = Field(alias="cusName")
    items: List[str]
    amount: float
    timestamp: float
    status: str

    class Config:
        populate_by_name = True

class OrderStatusUpdate(BaseModel):
    status: str

# ─── ENDPOINTS ───

# GET Inventory
@app.get("/api/v1/inventory", response_model=List[InventoryItem])
def get_inventory(db: Session = Depends(get_db)):
    db_items = db.query(DbInventoryItem).all()
    # Map model to match JS camelCase
    result = []
    for item in db_items:
        result.append(InventoryItem(
            id=item.id,
            name=item.name,
            price=item.price,
            emoji=item.emoji,
            quantity=item.quantity,
            unit=item.unit,
            inStock=item.in_stock
        ))
    return result

# POST Inventory (Create)
@app.post("/api/v1/inventory", response_model=InventoryItem, status_code=status.HTTP_201_CREATED)
def create_inventory_item(item: InventoryItemCreate, db: Session = Depends(get_db)):
    db_item = DbInventoryItem(
        name=item.name,
        price=item.price,
        emoji=item.emoji,
        quantity=item.quantity,
        unit=item.unit,
        in_stock=item.inStock
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return InventoryItem(
        id=db_item.id,
        name=db_item.name,
        price=db_item.price,
        emoji=db_item.emoji,
        quantity=db_item.quantity,
        unit=db_item.unit,
        inStock=db_item.in_stock
    )

# PUT Inventory (Update)
@app.put("/api/v1/inventory/{item_id}", response_model=InventoryItem)
def update_inventory_item(item_id: int, item: InventoryItemCreate, db: Session = Depends(get_db)):
    db_item = db.query(DbInventoryItem).filter(DbInventoryItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db_item.name = item.name
    db_item.price = item.price
    db_item.emoji = item.emoji
    db_item.quantity = item.quantity
    db_item.unit = item.unit
    db_item.in_stock = item.inStock
    
    db.commit()
    db.refresh(db_item)
    return InventoryItem(
        id=db_item.id,
        name=db_item.name,
        price=db_item.price,
        emoji=db_item.emoji,
        quantity=db_item.quantity,
        unit=db_item.unit,
        inStock=db_item.in_stock
    )

# DELETE Inventory
@app.delete("/api/v1/inventory/{item_id}")
def delete_inventory_item(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(DbInventoryItem).filter(DbInventoryItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(db_item)
    db.commit()
    return {"success": True}

# GET Orders
@app.get("/api/v1/orders", response_model=List[OrderBase])
def get_orders(db: Session = Depends(get_db)):
    db_orders = db.query(DbOrder).all()
    result = []
    for o in db_orders:
        result.append(OrderBase(
            id=o.id,
            cusName=o.cus_name,
            items=o.items.split(",") if o.items else [],
            amount=o.amount,
            timestamp=o.timestamp,
            status=o.status
        ))
    return result

# POST Order (Create)
@app.post("/api/v1/orders", response_model=OrderBase, status_code=status.HTTP_201_CREATED)
def create_order(order: OrderBase, db: Session = Depends(get_db)):
    db_order = DbOrder(
        id=order.id,
        cus_name=order.cusName,
        items=",".join(order.items),
        amount=order.amount,
        timestamp=order.timestamp,
        status=order.status
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return order

# PUT Order Status
@app.put("/api/v1/orders/{order_id}/status", response_model=OrderBase)
def update_order_status(order_id: str, payload: OrderStatusUpdate, db: Session = Depends(get_db)):
    db_order = db.query(DbOrder).filter(DbOrder.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    db_order.status = payload.status
    db.commit()
    db.refresh(db_order)
    
    return OrderBase(
        id=db_order.id,
        cusName=db_order.cus_name,
        items=db_order.items.split(",") if db_order.items else [],
        amount=db_order.amount,
        timestamp=db_order.timestamp,
        status=db_order.status
    )

# Pre-populate some dummy database values if database is empty
@app.on_event("startup")
def populate_db():
    db = SessionLocal()
    try:
        if db.query(DbInventoryItem).count() == 0:
            initial_items = [
                DbInventoryItem(name="Milk", price=40, emoji="🥛", quantity=50, unit="litre", in_stock=True),
                DbInventoryItem(name="Bread", price=35, emoji="🍞", quantity=20, unit="packet", in_stock=True),
                DbInventoryItem(name="Eggs", price=60, emoji="🥚", quantity=12, unit="dozen", in_stock=True),
                DbInventoryItem(name="Rice", price=300, emoji="🍚", quantity=15, unit="kg", in_stock=True),
                DbInventoryItem(name="Dal", price=80, emoji="🫘", quantity=25, unit="kg", in_stock=True),
                DbInventoryItem(name="Sugar", price=50, emoji="🍬", quantity=0, unit="kg", in_stock=False),
                DbInventoryItem(name="Oil", price=220, emoji="🫒", quantity=8, unit="litre", in_stock=True),
                DbInventoryItem(name="Tea", price=120, emoji="☕", quantity=18, unit="packet", in_stock=True),
                DbInventoryItem(name="Butter", price=55, emoji="🧈", quantity=14, unit="packet", in_stock=True),
                DbInventoryItem(name="Salt", price=20, emoji="🧂", quantity=0, unit="packet", in_stock=False),
            ]
            db.bulk_save_objects(initial_items)
            db.commit()
            
        if db.query(DbOrder).count() == 0:
            initial_orders = [
                DbOrder(id="ORD-001", cus_name="Rajesh Patel", items="Milk,Bread,Eggs", amount=135, timestamp=time.time()*1000 - 3600000, status="Delivered"),
                DbOrder(id="ORD-002", cus_name="Priya Kumar", items="Rice,Dal", amount=380, timestamp=time.time()*1000 - 2400000, status="Delivered"),
                DbOrder(id="ORD-003", cus_name="Amit Singh", items="Oil,Sugar", amount=270, timestamp=time.time()*1000 - 1800000, status="Accepted"),
                DbOrder(id="ORD-004", cus_name="Neha Desai", items="Tea,Bread,Milk", amount=195, timestamp=time.time()*1000 - 1200000, status="Pending"),
                DbOrder(id="ORD-005", cus_name="Vikram Sharma", items="Eggs,Sugar,Dal", amount=190, timestamp=time.time()*1000 - 600000, status="Rejected"),
                DbOrder(id="ORD-006", cus_name="Anjali Gupta", items="Milk,Rice", amount=340, timestamp=time.time()*1000 - 300000, status="Pending"),
            ]
            db.bulk_save_objects(initial_orders)
            db.commit()
    finally:
        db.close()
```
