import hashlib
from datetime import datetime, timedelta

from jose import jwt

SECRET_KEY = "oneforall_secret_key_12345"
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password


def create_token(data: dict) -> str:
    token_data = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=15)
    token_data["exp"] = expire
    return jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
