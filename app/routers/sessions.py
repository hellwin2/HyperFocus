from datetime import datetime, date, time, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session as DBSession, select

from app.core.deps import get_current_user
from app.db import get_session
from app.models import Session as WorkSession, User
from app.schemas import SessionStart, SessionRead

router = APIRouter(prefix="/sessions", tags=["sessions"])

@router.post("/start", response_model=SessionRead, status_code=status.HTTP_201_CREATED)
def start_session(
    session_in: SessionStart,
    db: DBSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Start a new work session for the current user.
    """
    # Check if user already has an active session
    active_session = db.exec(
        select(WorkSession).where(
            WorkSession.user_id == current_user.id,
            WorkSession.end_time.is_(None),
        )
    ).first()

    if active_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has an active session",
        )

    start_time = session_in.start_time or datetime.now(timezone.utc)

    new_session = WorkSession(
        user_id=current_user.id,
        start_time=start_time,
    )

    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return new_session

@router.post("/{session_id}/end", response_model=SessionRead)
def end_session(
    session_id: int,
    db: DBSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    End a work session.
    """
    work_session = db.get(WorkSession, session_id)
    if not work_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )
    
    if work_session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    if work_session.end_time is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session is already ended",
        )

    work_session.end_time = datetime.now(timezone.utc)
    db.add(work_session)
    db.commit()
    db.refresh(work_session)

    return work_session

@router.get("/", response_model=list[SessionRead])
def get_my_sessions(
    day: date | None = Query(
        default=None,
        description="Filter by day (YYYY-MM-DD).",
    ),
    db: DBSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get all sessions for the current user.
    """
    query = select(WorkSession).where(WorkSession.user_id == current_user.id)

    if day is not None:
        day_start = datetime.combine(day, time.min)
        day_end = datetime.combine(day, time.max)
        query = query.where(
            WorkSession.start_time >= day_start,
            WorkSession.start_time <= day_end,
        )

    query = query.order_by(WorkSession.start_time.desc())
    sessions = db.exec(query).all()
    return sessions

@router.get("/{session_id}", response_model=SessionRead)
def get_session_by_id(
    session_id: int,
    db: DBSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific session by ID.
    """
    work_session = db.get(WorkSession, session_id)
    if not work_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )
    if work_session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return work_session
