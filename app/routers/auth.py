from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db import get_session
from app.models import User
from app.schemas import Token, UserCreate, UserRead

router = APIRouter()

@router.post("/login/access-token", response_model=Token)
def login_access_token(
    session: Session = Depends(get_session), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

@router.post("/register", response_model=UserRead)
def register_user(
    *,
    session: Session = Depends(get_session),
    user_in: UserCreate,
) -> Any:
    """
    Create new user without the need to be logged in
    """
    user = session.exec(select(User).where(User.email == user_in.email)).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    
    user_create = User.model_validate(user_in, update={"hashed_password": get_password_hash(user_in.password)})
    session.add(user_create)
    session.commit()
    session.refresh(user_create)
    return user_create
