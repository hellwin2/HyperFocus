from typing import Generator

from sqlmodel import SQLModel, Session, create_engine
from typing import Generator

from sqlmodel import SQLModel, Session, create_engine
from .models import User, Session as WorkSession, Interruption  # 👈 añade esta línea


from app.core.config import settings

# Use the DATABASE_URL from settings (which reads from env vars)
# If it starts with "postgres://", replace it with "postgresql://" for SQLAlchemy compatibility
DATABASE_URL = settings.DATABASE_URL
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Configure engine based on DB type
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args=connect_args,
)


def create_db_and_tables() -> None:
    """
    Crea todas las tablas definidas en los modelos SQLModel.
    Esta función se llamará al iniciar la aplicación.
    """
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """
    Dependencia que proporciona una sesión de base de datos.
    La usaremos con Depends en los endpoints.
    """
    with Session(engine) as session:
        yield session
