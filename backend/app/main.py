from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from .database import engine, Base, get_db
from . import crud, schemas, models

# Create database tables automatically
# Note: In a larger production app, we would use Alembic migrations.
# For this deployment, auto-creation simplifies container startup.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory & Order Management System API",
    description="Backend API for managing products, customers, orders, and stock levels.",
    version="1.0.0"
)

# Enable CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development/demo. For production, restrict to frontend domain.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {
        "message": "Welcome to the Inventory & Order Management API",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }


# ==========================================
# PRODUCT ENDPOINTS
# ==========================================

@app.post("/products", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    # Check for SKU uniqueness
    db_product = crud.get_product_by_sku(db, sku=product.sku)
    if db_product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product SKU/code '{product.sku}' is already registered."
        )
    return crud.create_product(db=db, product=product)


@app.get("/products", response_model=List[schemas.ProductResponse])
def get_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_products(db=db, skip=skip, limit=limit)


@app.get("/products/{id}", response_model=schemas.ProductResponse)
def get_product(id: int, db: Session = Depends(get_db)):
    db_product = crud.get_product(db=db, product_id=id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {id} not found."
        )
    return db_product


@app.put("/products/{id}", response_model=schemas.ProductResponse)
def update_product(id: int, product_update: schemas.ProductUpdate, db: Session = Depends(get_db)):
    # If updating SKU, check uniqueness
    if product_update.sku is not None:
        db_product_by_sku = crud.get_product_by_sku(db, sku=product_update.sku)
        if db_product_by_sku and db_product_by_sku.id != id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product SKU/code '{product_update.sku}' is already in use by another product."
            )
            
    updated_product = crud.update_product(db=db, product_id=id, product_update=product_update)
    if not updated_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {id} not found."
        )
    return updated_product


@app.delete("/products/{id}", response_model=schemas.ProductResponse)
def delete_product(id: int, db: Session = Depends(get_db)):
    # Check if product is referenced in any order items
    # In strict production database designs, we block deletion of products associated with past orders
    # to maintain financial audit trails. Let's check for reference.
    is_ordered = db.query(models.OrderItem).filter(models.OrderItem.product_id == id).first()
    if is_ordered:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete product because it is referenced in one or more order records."
        )
        
    db_product = crud.delete_product(db=db, product_id=id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {id} not found."
        )
    return db_product


# ==========================================
# CUSTOMER ENDPOINTS
# ==========================================

@app.post("/customers", response_model=schemas.CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    # Check for email uniqueness
    db_customer = crud.get_customer_by_email(db, email=customer.email)
    if db_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer with email '{customer.email}' is already registered."
        )
    return crud.create_customer(db=db, customer=customer)


@app.get("/customers", response_model=List[schemas.CustomerResponse])
def get_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_customers(db=db, skip=skip, limit=limit)


@app.get("/customers/{id}", response_model=schemas.CustomerResponse)
def get_customer(id: int, db: Session = Depends(get_db)):
    db_customer = crud.get_customer(db=db, customer_id=id)
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {id} not found."
        )
    return db_customer


@app.delete("/customers/{id}", response_model=schemas.CustomerResponse)
def delete_customer(id: int, db: Session = Depends(get_db)):
    db_customer = crud.delete_customer(db=db, customer_id=id)
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {id} not found."
        )
    return db_customer


# ==========================================
# ORDER ENDPOINTS
# ==========================================

@app.post("/orders", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    return crud.create_order(db=db, order_in=order)


@app.get("/orders", response_model=List[schemas.OrderResponse])
def get_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_orders(db=db, skip=skip, limit=limit)


@app.get("/orders/{id}", response_model=schemas.OrderResponse)
def get_order(id: int, db: Session = Depends(get_db)):
    db_order = crud.get_order(db=db, order_id=id)
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {id} not found."
        )
    return db_order


@app.delete("/orders/{id}", response_model=schemas.OrderResponse)
def delete_order(id: int, db: Session = Depends(get_db)):
    deleted_order = crud.delete_order(db=db, order_id=id)
    if not deleted_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {id} not found."
        )
    return deleted_order


# ==========================================
# DASHBOARD ENDPOINTS
# ==========================================

@app.get("/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db=db)
