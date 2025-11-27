from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.deps import get_current_active_superuser, get_current_user
from app.core.security import get_password_hash
from app.db import get_session
from app.models import User
from app.schemas import UserCreate, UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserRead)
def read_user_me(
    current_user: User = Depends(get_current_user),
):
    """
    Get current user.
    """
    return current_user

@router.get("/", response_model=List[UserRead], dependencies=[Depends(get_current_active_superuser)])
def read_users(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
):
    """
    Retrieve users. Only for superusers.
    """
    users = session.exec(select(User).offset(skip).limit(limit)).all()
    return users

@router.post("/", response_model=UserRead, dependencies=[Depends(get_current_active_superuser)])
def create_user(
    *,
    session: Session = Depends(get_session),
    user_in: UserCreate,
):
    """
    Create new user. Only for superusers.
    """
    user = session.exec(select(User).where(User.email == user_in.email)).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    user = User.model_validate(user_in, update={"hashed_password": get_password_hash(user_in.password)})
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@router.get("/{user_id}", response_model=UserRead, dependencies=[Depends(get_current_active_superuser)])
def read_user_by_id(
    user_id: int,
    session: Session = Depends(get_session),
):
    """
    Get a specific user by id. Only for superusers.
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )
    return user
