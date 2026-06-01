from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

# Create engine (synchronous PostgreSQL engine using psycopg2)
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True  # Automatically checks connection health before executing queries
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
