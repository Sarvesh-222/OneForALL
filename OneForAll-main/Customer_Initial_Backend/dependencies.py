import os
from fastapi import Depends
from fastapi import HTTPException
from fastapi.security import OAuth2PasswordBearer # This is used to get the token from the request header
from jose import jwt

oauth_scheme = OAuth2PasswordBearer(tokenUrl="login") #token comes from login endpoint

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

def get_current_user(token:str=Depends(oauth_scheme)): # extracts token from request header and decodes it to get user data
    try:
        payload = jwt.decode(token,SECRET_KEY,algorithms=[ALGORITHM])
        return payload
    except:
        raise HTTPException(status_code=401,detail="Invalid Token")
    

