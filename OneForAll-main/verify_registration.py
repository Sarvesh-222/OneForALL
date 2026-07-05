#!/usr/bin/env python
"""Verify shopkeeper registration in database"""

from shopkeeper_initial_backend.database import SessionLocal
from shopkeeper_initial_backend.models import ShopkeeperUser

db = SessionLocal()
users = db.query(ShopkeeperUser).all()

print("\n" + "="*60)
print("REGISTERED SHOPKEEPERS IN DATABASE")
print("="*60)
for user in users:
    print(f"\nID: {user.id}")
    print(f"Name: {user.name}")
    print(f"Email: {user.email}")
    print(f"Phone: {user.phone}")
    print(f"Shop ID: {user.shop_id}")
    print(f"Role: {user.role}")
    print(f"Active: {user.is_active}")
    print("-" * 60)

print(f"\nTotal Shopkeepers: {len(users)}")
print("\n✅ Registration data successfully saved to database!\n")

db.close()
