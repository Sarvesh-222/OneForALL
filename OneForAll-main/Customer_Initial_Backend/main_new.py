from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends # This is used to get the database session in the endpoint functions
from sqlalchemy.orm import Session
from database import SessionLocal
from models_new import Product
from schemas_new import ProductCreate, ProductResponse
from schemas_new import UpdateProduct

app=FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal() # This will create a new session for us

    try:
        yield db # This will return the session to the caller and will be used in the endpoint functions
    finally:
        db.close() # This will close the session after the request is completed

@app.post(
    "/create-product",
    response_model=ProductResponse
)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    try:
        new_product = Product(
            shop_id=product.shop_id,
            name=product.name,
            price=product.price,
            stock_quantity=product.stock_quantity,
            is_available=product.is_available
        )
        db.add(new_product)
        db.commit()
        db.refresh(new_product)
        return new_product
    except Exception as e:

        db.rollback()

        return {
            "error": str(e)
        }
    
@app.get("/get-product",response_model=list[ProductResponse])
def get_product(db:Session=Depends(get_db)):
    products = db.query(Product).all() # This will query the database and return all the products
    return products

#get product based on id
@app.get("/get-product/{product_id}",response_model=ProductResponse)
def get_product_by_id(product_id:int,db:Session=Depends(get_db)):
    product=db.query(Product).filter(Product.id==product_id).first() # This will query the database and return the product with the given id. first() will return the first result or None if no result is found
    return product

@app.put("/update-product/{product_id}",response_model=ProductResponse)
def update_product(product_id:int,product:UpdateProduct,db:Session=Depends(get_db)):
    db_product= db.query(Product).filter(Product.id==product_id).first() 
    if not db_product:
        return {"error": "Product not found"}
    if product.shop_id is not None:
        db_product.shop_id=product.shop_id
    if product.name is not None:
        db_product.name=product.name
    if product.price is not None:
        db_product.price=product.price
    if product.stock_quantity is not None:
        db_product.stock_quantity=product.stock_quantity
    if product.is_available is not None:
        db_product.is_available=product.is_available

    db.commit()
    db.refresh(db_product)
    return db_product