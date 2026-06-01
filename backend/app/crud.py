from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from . import models, schemas

# --- Product CRUD ---
def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str):
    return db.query(models.Product).filter(models.Product.sku == sku).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(
        name=product.name,
        sku=product.sku,
        price=product.price,
        quantity=product.quantity
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product_update: schemas.ProductUpdate):
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    
    update_data = product_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    db.delete(db_product)
    db.commit()
    return db_product


# --- Customer CRUD ---
def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str):
    return db.query(models.Customer).filter(models.Customer.email == email).first()

def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Customer).offset(skip).limit(limit).all()

def create_customer(db: Session, customer: schemas.CustomerCreate):
    db_customer = models.Customer(
        name=customer.name,
        email=customer.email,
        phone=customer.phone
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        return None
    db.delete(db_customer)
    db.commit()
    return db_customer


# --- Order CRUD ---
def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def get_orders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Order).order_by(models.Order.created_at.desc()).offset(skip).limit(limit).all()

def create_order(db: Session, order_in: schemas.OrderCreate):
    """
    Creates an order, verifies inventory levels, decrements stock, 
    and automatically calculates the total amount in a single atomic transaction.
    """
    # Verify customer exists
    customer = get_customer(db, order_in.customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {order_in.customer_id} not found"
        )

    # We run the entire ordering process in a manual transaction block
    try:
        total_amount = 0.0
        order_items = []
        
        # 1. Create the Order shell first (so we can get an ID for items)
        db_order = models.Order(
            customer_id=order_in.customer_id,
            total_amount=0.0  # Placeholder, will calculate and update
        )
        db.add(db_order)
        db.flush()  # Generates the db_order.id
        
        for item_in in order_in.items:
            # Get product with exclusive lock to prevent race conditions in concurrent orders
            # (SELECT ... FOR UPDATE)
            product = db.query(models.Product).filter(models.Product.id == item_in.product_id).with_for_update().first()
            
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {item_in.product_id} not found"
                )
            
            # Check inventory sufficiency
            if product.quantity < item_in.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for product '{product.name}' (SKU: {product.sku}). Available: {product.quantity}, Requested: {item_in.quantity}"
                )
            
            # Reduce inventory
            product.quantity -= item_in.quantity
            
            # Calculate item price and accumulate total amount
            item_cost = product.price * item_in.quantity
            total_amount += item_cost
            
            # Create order item
            db_item = models.OrderItem(
                order_id=db_order.id,
                product_id=product.id,
                quantity=item_in.quantity,
                price_at_order=product.price
            )
            db.add(db_item)
            order_items.append(db_item)
            
        # Update order total amount
        db_order.total_amount = total_amount
        
        # Commit the transaction
        db.commit()
        db.refresh(db_order)
        return db_order
        
    except HTTPException as he:
        # Re-raise HTTPExceptions as they represent validation errors we handled
        db.rollback()
        raise he
    except Exception as e:
        # Rollback database on any other unexpected system error
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create order: {str(e)}"
        )

def delete_order(db: Session, order_id: int):
    """
    Cancels/deletes an order.
    Restores the stock quantities of its items back to the product inventory in an atomic transaction.
    """
    db_order = get_order(db, order_id)
    if not db_order:
        return None

    try:
        # Restore stock for each item
        for item in db_order.items:
            # Lock the product row for update
            product = db.query(models.Product).filter(models.Product.id == item.product_id).with_for_update().first()
            if product:
                product.quantity += item.quantity
        
        # Delete the order (cascade deletes order_items automatically via foreign key/SQLAlchemy relationship config)
        db.delete(db_order)
        db.commit()
        return db_order
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete/cancel order: {str(e)}"
        )


# --- Dashboard Stats CRUD ---
def get_dashboard_stats(db: Session):
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    
    # Define "low stock" as quantity < 10
    low_stock_query = db.query(models.Product).filter(models.Product.quantity < 10)
    low_stock_count = low_stock_query.count()
    low_stock_products = low_stock_query.all()
    
    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_count": low_stock_count,
        "low_stock_products": [
            {
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "quantity": p.quantity
            } for p in low_stock_products
        ]
    }
