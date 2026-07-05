from fastapi import FastAPI
from fastapi import Depends # This is used to get the database session in the endpoint functions

from database import SessionLocal
from models import User
from schemas import UserCreate
from schemas import UpdateUser
from schemas import LoginRequest

from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from models_new import Product
from schemas_new import ProductCreate, ProductResponse
from schemas_new import UpdateProduct

from auth import hash_password
from auth import verify_password
from auth import create_token

from dependencies import get_current_user
from fastapi.middleware.cors import CORSMiddleware

app= FastAPI()

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

@app.post("/register")
def register(user:UserCreate,db:Session=Depends(get_db)):
    hashed= hash_password(user.password)

    new_user = User(phone=user.phone,email=user.email,name=user.name,password_hash=hashed,role=user.role) # This will create a new user object using the data from the request body
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message":"User created successfully",
        "id":new_user.id
    }

@app.post("/login")
def login(data:LoginRequest,db:Session=Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        return {"error": "User not found"}
    if not verify_password(data.password,user.password_hash):
        return{"error":"Invalid Password"}
    token = create_token({"user_id":user.id,"role":user.role}) # This will create a JWT token with the user id and role as the payload
    return {"access_token": token,"token_type":"bearer"} # This will return the access token and the token type to the client

# @app.post("/create-user")
# def create_user(user:UserCreate,db:Session=Depends(get_db)):
#     try:
#         new_user = User(id=user.id,phone= user.phone,email=user.email,name=user.name,password_hash=user.password_hash,role=user.role) # This will create a new user object using the data from the request body
#         db.add(new_user) # This will add the new user to the session
#         db.commit()
#         db.refresh(new_user) # This will refresh the new user object with the data from the database
#         return new_user
#     except Exception as e:
#         return {"error": str(e)}

@app.get("/profile")
def profile(user=Depends(get_current_user)):
    return{
        "user":user
    }

#get user based on id
# @app.get("/get-user/{user_id}")
# def get_user_by_id(user_id:int,db:Session=Depends(get_db)):
#     user=db.query(User).filter(User.id==user_id).first() # This will query the database and return the user with the given id. first() will return the first result or None if no result is found
#     return user

# @app.put("/update-user/{user_id}")
# def update_user(user_id:int,user:UpdateUser,db:Session=Depends(get_db)):
#     db_user= db.query(User).filter(User.id==user_id).first() 
#     if not db_user:
#         return {"error": "User not found"}
#     if user.phone is not None:
#         db_user.phone=user.phone
#     if user.email is not None:
#         db_user.email=user.email
#     if user.name is not None:
#         db_user.name=user.name
#     if user.role is not None:
#         db_user.role=user.role
#     if user.is_active is not None:
#         db_user.is_active=user.is_active

#     db.commit()
#     db.refresh(db_user)
#     return db_user

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

