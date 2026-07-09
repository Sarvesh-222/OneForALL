import json
import os
import shutil
import sys
from decimal import Decimal
from typing import Any
from uuid import uuid4

from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy.orm import Session

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

UPLOAD_ROOT = os.path.join(PROJECT_ROOT, "uploads")
UPLOAD_IMAGE_DIR = os.path.join(UPLOAD_ROOT, "images")
os.makedirs(UPLOAD_IMAGE_DIR, exist_ok=True)

from shopkeeper_initial_backend.auth import create_token, hash_password, verify_password
from shopkeeper_initial_backend.database import SessionLocal
from shopkeeper_initial_backend.dependencies import get_current_shopkeeper
from shopkeeper_initial_backend.models import OrderRecord, Product, ShopkeeperUser, Base
from shopkeeper_initial_backend.schemas import (
    LoginRequest,
    ProductCreate,
    ProductResponse,
    ProductUpdate,
    ShopkeeperCreate,
    ShopkeeperResponse,
    ShopkeeperUpdate,
)

app = FastAPI(title="Shopkeeper Initial Backend")
app.mount("/uploads", StaticFiles(directory=UPLOAD_ROOT), name="uploads")

# Create tables (do NOT drop existing data)
Base.metadata.create_all(bind=SessionLocal.kw["bind"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class InventoryItemCreate(BaseModel):
    name: str
    price: float
    quantity: float = 0
    unit: str = "kg"
    emoji: str = "📦"
    inStock: bool = True
    image: str | None = None


class InventoryItemResponse(InventoryItemCreate):
    id: int


class OrderCreate(BaseModel):
    id: str
    cusName: str
    items: list[str]
    amount: float
    timestamp: int
    status: str = "Pending"


class OrderStatusUpdate(BaseModel):
    status: str


DEFAULT_INVENTORY = [
    {"id": 1, "name": "Milk", "price": 40, "emoji": "🥛", "quantity": 50, "unit": "litre", "inStock": True},
    {"id": 2, "name": "Bread", "price": 35, "emoji": "🍞", "quantity": 20, "unit": "packet", "inStock": True},
    {"id": 3, "name": "Eggs", "price": 60, "emoji": "🥚", "quantity": 12, "unit": "dozen", "inStock": True},
]
DEFAULT_ORDERS = [
    {"id": "ORD-001", "cusName": "Rajesh Patel", "items": ["Milk", "Bread"], "amount": 135, "timestamp": 1717672200000, "status": "Delivered"},
    {"id": "ORD-002", "cusName": "Priya Kumar", "items": ["Eggs"], "amount": 60, "timestamp": 1717673200000, "status": "Pending"},
]

inventory_store = [dict(item) for item in DEFAULT_INVENTORY]
orders_store = [dict(order) for order in DEFAULT_ORDERS]


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_seed_shopkeeper():
    db = SessionLocal()
    try:
        existing = db.query(ShopkeeperUser).filter(ShopkeeperUser.email == "admin").first()
        if not existing:
            db.add(
                ShopkeeperUser(
                    shop_id=1,
                    phone="9999999999",
                    email="admin",
                    name="FreshMart Admin",
                    password_hash=hash_password("admin"),
                    role="shopkeeper",
                )
            )
            db.commit()
    finally:
        db.close()


def seed_demo_data():
    db = SessionLocal()
    try:
        if db.query(Product).count() == 0:
            for item in DEFAULT_INVENTORY:
                db.add(
                    Product(
                        shop_id=1,
                        name=item["name"],
                        price=Decimal(str(item["price"])),
                        stock_quantity=int(item["quantity"]),
                        is_available=bool(item["inStock"]),
                        emoji=item["emoji"],
                        unit=item["unit"],
                    )
                )
        if db.query(OrderRecord).count() == 0:
            for order in DEFAULT_ORDERS:
                db.add(
                    OrderRecord(
                        id=order["id"],
                        shop_id=1,
                        cus_name=order["cusName"],
                        items=json.dumps(order["items"]),
                        amount=Decimal(str(order["amount"])),
                        timestamp=int(order["timestamp"]),
                        status=order["status"],
                    )
                )
        db.commit()
    finally:
        db.close()


ensure_seed_shopkeeper()
seed_demo_data()


@app.post("/register", response_model=dict)
def register(shopkeeper: ShopkeeperCreate, db: Session = Depends(get_db)):
    hashed = hash_password(shopkeeper.password)
    new_shopkeeper = ShopkeeperUser(
        shop_id=shopkeeper.shop_id,
        phone=shopkeeper.phone,
        email=shopkeeper.email,
        name=shopkeeper.name,
        password_hash=hashed,
        role=shopkeeper.role.value,
    )
    db.add(new_shopkeeper)
    db.commit()
    db.refresh(new_shopkeeper)

    return {"message": "Shopkeeper created successfully", "id": new_shopkeeper.id}


@app.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    shopkeeper = db.query(ShopkeeperUser).filter(ShopkeeperUser.email == data.email).first()
    if not shopkeeper:
        return {"error": "Shopkeeper not found"}
    if not verify_password(data.password, shopkeeper.password_hash):
        return {"error": "Invalid Password"}

    token = create_token({"user_id": shopkeeper.id, "role": shopkeeper.role})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/profile")
def profile(shopkeeper=Depends(get_current_shopkeeper)):
    return {"shopkeeper": shopkeeper}


@app.get("/shopkeepers", response_model=list[ShopkeeperResponse])
def list_shopkeepers(db: Session = Depends(get_db)):
    return db.query(ShopkeeperUser).all()


@app.get("/shopkeepers/{shopkeeper_id}", response_model=ShopkeeperResponse)
def get_shopkeeper(shopkeeper_id: int, db: Session = Depends(get_db)):
    shopkeeper = db.query(ShopkeeperUser).filter(ShopkeeperUser.id == shopkeeper_id).first()
    if not shopkeeper:
        return {"error": "Shopkeeper not found"}
    return shopkeeper


@app.put("/shopkeepers/{shopkeeper_id}", response_model=ShopkeeperResponse)
def update_shopkeeper(shopkeeper_id: int, payload: ShopkeeperUpdate, db: Session = Depends(get_db)):
    shopkeeper = db.query(ShopkeeperUser).filter(ShopkeeperUser.id == shopkeeper_id).first()
    if not shopkeeper:
        return {"error": "Shopkeeper not found"}

    if payload.shop_id is not None:
        shopkeeper.shop_id = payload.shop_id
    if payload.phone is not None:
        shopkeeper.phone = payload.phone
    if payload.email is not None:
        shopkeeper.email = payload.email
    if payload.name is not None:
        shopkeeper.name = payload.name
    if payload.role is not None:
        shopkeeper.role = payload.role.value
    if payload.is_active is not None:
        shopkeeper.is_active = payload.is_active

    db.commit()
    db.refresh(shopkeeper)
    return shopkeeper


@app.post("/products", response_model=ProductResponse)
def create_shop_product(payload: ProductCreate, db: Session = Depends(get_db)):
    try:
        new_product = Product(
            shop_id=payload.shop_id,
            name=payload.name,
            price=payload.price,
            stock_quantity=payload.stock_quantity or 10,
            is_available=payload.is_available if payload.is_available is not None else True,
        )
        db.add(new_product)
        db.commit()
        db.refresh(new_product)
        return new_product
    except Exception as exc:
        db.rollback()
        return {"error": str(exc)}


@app.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    shopkeeper=Depends(get_current_shopkeeper),
    request: Request = None,
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")

    extension = os.path.splitext(file.filename)[1].lower()
    if extension not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        raise HTTPException(status_code=400, detail="Only image files are supported")

    filename = f"{uuid4().hex}{extension}"
    destination = os.path.join(UPLOAD_IMAGE_DIR, filename)
    try:
        with open(destination, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        file.file.close()

    base_url = str(request.base_url).rstrip("/")
    return {"url": f"{base_url}/uploads/images/{filename}"}


@app.get("/products", response_model=list[ProductResponse])
def list_shop_products(shop_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(Product)
    if shop_id is not None:
        query = query.filter(Product.shop_id == shop_id)
    return query.all()


@app.get("/products/{product_id}", response_model=ProductResponse)
def get_shop_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return {"error": "Product not found"}
    return product


@app.put("/products/{product_id}", response_model=ProductResponse)
def update_shop_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return {"error": "Product not found"}

    if payload.shop_id is not None:
        product.shop_id = payload.shop_id
    if payload.name is not None:
        product.name = payload.name
    if payload.price is not None:
        product.price = payload.price
    if payload.stock_quantity is not None:
        product.stock_quantity = payload.stock_quantity
    if payload.is_available is not None:
        product.is_available = payload.is_available

    db.commit()
    db.refresh(product)
    return product


def product_to_inventory_response(product: Product) -> dict[str, Any]:
    return {
        "id": product.id,
        "name": product.name,
        "price": float(product.price),
        "quantity": product.stock_quantity,
        "unit": product.unit or "kg",
        "emoji": product.emoji or "📦",
        "inStock": bool(product.is_available if product.is_available is not None else product.stock_quantity > 0),
        "image": product.image,
    }


def order_to_response(order: OrderRecord) -> dict[str, Any]:
    items = []
    if order.items:
        try:
            items = json.loads(order.items)
        except Exception:
            items = [item.strip() for item in order.items.split(",") if item.strip()]
    return {
        "id": order.id,
        "cusName": order.cus_name,
        "items": items,
        "amount": float(order.amount),
        "timestamp": order.timestamp,
        "status": order.status,
    }


@app.get("/api/v1/inventory", response_model=list[InventoryItemResponse])
def get_inventory_api(db: Session = Depends(get_db)):
    products = db.query(Product).order_by(Product.id).all()
    return [product_to_inventory_response(product) for product in products]


@app.post("/api/v1/inventory", response_model=InventoryItemResponse, status_code=201)
def create_inventory_api(payload: InventoryItemCreate, db: Session = Depends(get_db)):
    quantity = payload.quantity if payload.quantity is not None else 10
    in_stock = payload.inStock if payload.inStock is not None else True
    product = Product(
        shop_id=1,
        name=payload.name,
        price=Decimal(str(payload.price)),
        stock_quantity=quantity,
        is_available=in_stock,
        emoji=payload.emoji or "📦",
        unit=payload.unit or "kg",
        image=payload.image,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product_to_inventory_response(product)


@app.put("/api/v1/inventory/{item_id}", response_model=InventoryItemResponse)
def update_inventory_api(item_id: int, payload: dict[str, Any], db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == item_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Item not found")

    for key, value in payload.items():
        if key == "name":
            product.name = str(value)
        elif key == "price":
            product.price = Decimal(str(value))
        elif key == "quantity":
            product.stock_quantity = int(value)
        elif key == "inStock":
            product.is_available = bool(value)
        elif key == "emoji":
            product.emoji = str(value)
        elif key == "unit":
            product.unit = str(value)
        elif key == "image":
            product.image = value
        elif key == "stock_quantity":
            product.stock_quantity = int(value)
        elif key == "is_available":
            product.is_available = bool(value)

    db.commit()
    db.refresh(product)
    return product_to_inventory_response(product)


@app.delete("/api/v1/inventory/{item_id}")
def delete_inventory_api(item_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == item_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(product)
    db.commit()
    return {"deleted": True}


@app.get("/api/v1/orders")
def get_orders_api(db: Session = Depends(get_db)):
    orders = db.query(OrderRecord).order_by(OrderRecord.timestamp.desc()).all()
    return [order_to_response(order) for order in orders]


@app.post("/api/v1/orders", status_code=201)
def create_order_api(payload: OrderCreate, db: Session = Depends(get_db)):
    order = OrderRecord(
        id=payload.id,
        shop_id=1,
        cus_name=payload.cusName,
        items=json.dumps(payload.items),
        amount=Decimal(str(payload.amount)),
        timestamp=payload.timestamp,
        status=payload.status,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order_to_response(order)


@app.put("/api/v1/orders/{order_id}/status")
def update_order_status(order_id: str, payload: OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(OrderRecord).filter(OrderRecord.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = payload.status
    db.commit()
    db.refresh(order)
    return order_to_response(order)
