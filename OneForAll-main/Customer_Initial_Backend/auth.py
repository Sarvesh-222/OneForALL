

from passlib.context import CryptContext # used for hashing
from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = "oneforall_secret_key_12345"
ALGORITHM ="HS256"

pwd_context = CryptContext(schemes=["bcrypt"],deprecated="auto")  # This will create a password context that we can use to hash and verify passwords

def hash_password(password:str):
    return pwd_context.hash(password) # This will hash the password using the bcrypt algorithm

def verify_password(plain_password:str,hashed_password:str):
    return pwd_context.verify(plain_password,hashed_password) # This will verify the password by comparing the plain password with the hashed password

def create_token(data):
    token_data= data.copy()
    expire = datetime.utcnow()+timedelta(minutes=15) # token expires in 15 mins

    token_data["exp"]=expire # This will add the expiration time to the token data
    return jwt.encode(token_data,SECRET_KEY,algorithm=ALGORITHM)    # (JWT Token + SECRET_KEY = Valid Token)

