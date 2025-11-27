from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session as DBSession, select

from app.core.deps import get_current_user
from app.db import get_session
from app.models import Interruption, Session as WorkSession, User
from app.schemas import InterruptionCreate, InterruptionRead

router = APIRouter(prefix="/interruptions", tags=["interruptions"])

@router.post("/", response_model=InterruptionRead, status_code=status.HTTP_201_CREATED)
def create_interruption(
    interruption_in: InterruptionCreate,
    db: DBSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Register an interruption in an active session.
    """
    # Check if session exists
    work_session = db.get(WorkSession, interruption_in.session_id)
    if not work_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    # Check if session belongs to current user
    if work_session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    # Check if session is active
    if work_session.end_time is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add interruptions to a finished session",
        )

    # Calculate duration
    duration = int(
        (interruption_in.end_time - interruption_in.start_time).total_seconds()
    )

    if duration < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_time must be after start_time",
        )

    interruption = Interruption(
        session_id=interruption_in.session_id,
        user_id=current_user.id,
        type=interruption_in.type.value,
        description=interruption_in.description,
        start_time=interruption_in.start_time,
        end_time=interruption_in.end_time,
        duration=duration,
    )

    db.add(interruption)
    db.commit()
    db.refresh(interruption)

    return interruption

@router.get("/session/{session_id}", response_model=list[InterruptionRead])
def get_interruptions_for_session(
    session_id: int,
    db: DBSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    List all interruptions for a given session.
    """
    session = db.get(WorkSession, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )
    
    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    interruptions = db.exec(
        select(Interruption).where(Interruption.session_id == session_id)
    ).all()

    return interruptions
