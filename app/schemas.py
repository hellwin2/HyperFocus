from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Optional, Annotated, ClassVar

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    ValidationInfo,
    field_validator,
    ConfigDict
)

# ============================================================
# Enums
# ============================================================

class InterruptionType(str, Enum):
    external = "external"
    digital = "digital"
    internal = "internal"
    other = "other"
    # Legacy support if needed, but we'll stick to these new ones
    unknown = "unknown"


# ============================================================
# Token Schemas
# ============================================================

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None


# ============================================================
# User Schemas
# ============================================================

class UserBase(BaseModel):
    name: Annotated[str, Field(min_length=1, max_length=100)]
    email: EmailStr



class UserCreate(UserBase):
    """
    Datos necesarios para crear un usuario.
    """
    password: str = Field(min_length=8)

    model_config: ClassVar[ConfigDict] = ConfigDict(json_schema_extra={
        "example": {
            "name": "Victor",
            "email": "victor@example.com",
            "password": "strongpassword123"
        }
    })


class UserUpdate(UserBase):
    password: Optional[str] = Field(default=None, min_length=8)
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class UserRead(UserBase):
    """
    Datos públicos de un usuario.
    """
    id: int
    is_active: bool
    is_superuser: bool
    created_at: datetime

    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)


# ============================================================
# Session Schemas
# ============================================================

class SessionStart(BaseModel):
    """
    Esquema para iniciar una sesión de trabajo.
    start_time se puede enviar o, si es None, se establecerá en "ahora" en la lógica.
    """
    start_time: Optional[datetime] = None

    model_config: ClassVar[ConfigDict] = ConfigDict(json_schema_extra={
        "example": {
            "start_time": "2025-11-25T10:00:00Z"
        }
    })


class SessionRead(BaseModel):
    id: int
    user_id: int
    start_time: datetime
    end_time: Optional[datetime]
    created_at: datetime

    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)



# ============================================================
# Interruption Schemas
# ============================================================

class InterruptionBase(BaseModel):
    session_id: int
    type: InterruptionType = Field(description="Tipo de interrupción")
    description: Annotated[str, Field(min_length=1, max_length=500)]
    start_time: datetime
    end_time: datetime

    @field_validator("end_time")
    @classmethod
    def validate_end_after_start(
        cls,
        v: datetime,
        info: ValidationInfo,
    ) -> datetime:
        start = info.data.get("start_time")
        if start and v <= start:
            raise ValueError("end_time debe ser posterior a start_time")
        return v


class InterruptionCreate(InterruptionBase):
    """
    El cliente NO envía duration: el backend lo calculará como (end_time - start_time).
    """
    pass

    model_config: ClassVar[ConfigDict] = ConfigDict(json_schema_extra={
        "example": {
            "session_id": 1,
            "type": "digital",
            "description": "WhatsApp messages",
            "start_time": "2025-11-25T10:15:00Z",
            "end_time": "2025-11-25T10:17:30Z"
        }
    })


class InterruptionRead(BaseModel):
    id: int
    session_id: int
    user_id: int
    type: InterruptionType
    description: str
    start_time: datetime
    end_time: datetime
    duration: int
    created_at: datetime

    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)

