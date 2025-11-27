from datetime import datetime, timedelta, timezone
from typing import List, Optional

from sqlmodel import SQLModel, Field, Relationship


class User(SQLModel, table=True):
    """
    Usuario del sistema HyperFocus.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, max_length=100)
    email: str = Field(index=True, unique=True, max_length=255)
    hashed_password: str = Field(nullable=False)
    is_active: bool = Field(default=True)
    is_superuser: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relaciones
    sessions: List["Session"] = Relationship(back_populates="user")
    interruptions: List["Interruption"] = Relationship(back_populates="user")


class Session(SQLModel, table=True):
    """
    Bloque de trabajo de un usuario.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)

    start_time: datetime = Field(index=True)
    end_time: Optional[datetime] = Field(default=None, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relaciones
    user: Optional[User] = Relationship(back_populates="sessions")
    interruptions: List["Interruption"] = Relationship(back_populates="session")


class Interruption(SQLModel, table=True):
    """
    Interrupción concreta durante una sesión de trabajo.
    """
    id: Optional[int] = Field(default=None, primary_key=True)

    session_id: int = Field(foreign_key="session.id", index=True)
    user_id: int = Field(foreign_key="user.id", index=True)

    # El tipo real lo restringiremos en los schemas con un Enum
    type: str = Field(index=True, max_length=50, description="Tipo de interrupción")
    description: str = Field(max_length=500)

    start_time: datetime = Field(index=True)
    end_time: datetime = Field(index=True)
    duration: int = Field(
        ge=0,
        description="Duración de la interrupción en segundos (se calcula en el backend)",
    )

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relaciones
    session: Optional[Session] = Relationship(back_populates="interruptions")
    user: Optional[User] = Relationship(back_populates="interruptions")
