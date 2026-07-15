import databases
import sqlalchemy
from sqlalchemy.ext.declarative import declarative_base
from .config import settings

# Database URL
DATABASE_URL = settings.DATABASE_URL

# Create database interface
database = databases.Database(DATABASE_URL)

# SQLAlchemy metadata
metadata = sqlalchemy.MetaData()

# Create engine
engine = sqlalchemy.create_engine(DATABASE_URL)

# Base class for models
Base = declarative_base()

# Crisis Events Table
crisis_events_table = sqlalchemy.Table(
    "crisis_events",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True, index=True),
    sqlalchemy.Column("crisis_type", sqlalchemy.String(50), index=True),
    sqlalchemy.Column("severity", sqlalchemy.String(20), index=True),
    sqlalchemy.Column("confidence", sqlalchemy.Float),
    sqlalchemy.Column("location_name", sqlalchemy.String(200)),
    sqlalchemy.Column("country_iso", sqlalchemy.String(2)),
    sqlalchemy.Column("latitude", sqlalchemy.Float),
    sqlalchemy.Column("longitude", sqlalchemy.Float),
    sqlalchemy.Column("magnitude", sqlalchemy.Float, nullable=True),
    sqlalchemy.Column("casualties", sqlalchemy.Integer, nullable=True),
    sqlalchemy.Column("raw_text", sqlalchemy.Text),
    sqlalchemy.Column("source_name", sqlalchemy.String(100)),
    sqlalchemy.Column("source_type", sqlalchemy.String(50)),
    sqlalchemy.Column("trust_score", sqlalchemy.Float),
    sqlalchemy.Column("source_count", sqlalchemy.Integer, default=1),
    sqlalchemy.Column("official_confirmed", sqlalchemy.Boolean, default=False),
    sqlalchemy.Column("event_date", sqlalchemy.DateTime, nullable=True),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime),
    sqlalchemy.Column("updated_at", sqlalchemy.DateTime),
)

# User Sessions Table
user_sessions_table = sqlalchemy.Table(
    "user_sessions",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("session_id", sqlalchemy.String(100), unique=True, index=True),
    sqlalchemy.Column("user_role", sqlalchemy.String(20)),
    sqlalchemy.Column("user_location", sqlalchemy.String(200)),
    sqlalchemy.Column("preferences", sqlalchemy.JSON),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime),
    sqlalchemy.Column("last_active", sqlalchemy.DateTime),
)

# Chat History Table
chat_history_table = sqlalchemy.Table(
    "chat_history",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("session_id", sqlalchemy.String(100), index=True),
    sqlalchemy.Column("message_type", sqlalchemy.String(20)),  # user/assistant
    sqlalchemy.Column("content", sqlalchemy.Text),
    sqlalchemy.Column("user_role", sqlalchemy.String(20)),
    sqlalchemy.Column("timestamp", sqlalchemy.DateTime),
)

async def init_db():
    """Initialize database connection and create tables"""
    await database.connect()
    metadata.create_all(engine)

async def close_db():
    """Close database connection"""
    await database.disconnect()