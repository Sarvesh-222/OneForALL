import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Use PostgreSQL when DATABASE_URL or POSTGRES_URL is set; otherwise default to local SQLite.
DATABASE_URL = "postgresql://postgres:sarvesh@localhost:5432/oneforall"

# (
#     os.getenv("DATABASE_URL")
#     or os.getenv("POSTGRES_URL")
#     or "sqlite:///./shopkeeper.db"
# )
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
