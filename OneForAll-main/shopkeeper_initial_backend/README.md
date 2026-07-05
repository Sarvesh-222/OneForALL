# Shopkeeper Initial Backend

This folder mirrors the customer backend structure with a dedicated shopkeeper authentication flow and linked product management endpoints.

## What is included
- Shopkeeper registration and login
- JWT-based profile access
- Shopkeeper CRUD endpoints
- Shared product CRUD endpoints backed by the same `products` table used by the customer backend

## Notes
The backend expects a PostgreSQL database named `oneforall` with the credentials configured in the database module.
