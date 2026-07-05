from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import declarative_base

DATABASE_URL = ("postgresql://postgres:sarvesh@localhost:5432/oneforall")

engine= create_engine(DATABASE_URL) # This is the Connection bridge that will be used to connect to the database

SessionLocal = sessionmaker(autocommit=False,autoflush=False,bind=engine) # This is a factory function that will create a new session for us

Base=declarative_base() # This is the base class that we will use to create our models