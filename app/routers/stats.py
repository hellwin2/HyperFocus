from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session as DBSession

from app.core.deps import get_current_user
from app.db import get_session
from app.models import User
from app.core.stats_logic import (
    get_summary_stats,
    get_interruption_type_stats,
    get_productive_hours_stats,
    get_peak_distraction_hour,
    get_weekly_pattern,
)

router = APIRouter(prefix="/stats", tags=["stats"])

def _parse_range_days(range_str: str) -> int:
    """
    Parse range string like '7d', '30d' to int days.
    """
    range_str = range_str.strip().lower()
    if not range_str.endswith("d"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid range format. Use like '7d', '30d'.",
        )
    num_part = range_str[:-1]
    if not num_part.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid range value. Must be a number of days, e.g. '7d'.",
        )
    days = int(num_part)
    if days <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Range must be a positive number of days.",
        )
    return days

@router.get("/summary")
def stats_summary(
    range: str = Query("7d", description="Range of days, e.g. '7d', '30d'"),
    db: DBSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    General stats summary for the current user.
    """
    range_days = _parse_range_days(range)
    return get_summary_stats(user_id=current_user.id, db=db, range_days=range_days)

@router.get("/interruption-types")
def stats_interruption_types(
    range: str = Query("7d", description="Range of days, e.g. '7d', '30d'"),
    db: DBSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Interruption stats by type.
    """
    range_days = _parse_range_days(range)
    return get_interruption_type_stats(user_id=current_user.id, db=db, range_days=range_days)

@router.get("/productive-hours")
def stats_productive_hours(
    range: str = Query("7d", description="Range of days, e.g. '7d', '30d'"),
    db: DBSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Hourly stats: total work, interruptions, interruptions per effective hour.
    """
    range_days = _parse_range_days(range)
    return get_productive_hours_stats(user_id=current_user.id, db=db, range_days=range_days)

@router.get("/peak-distraction-time")
def stats_peak_distraction_time(
    range: str = Query("7d", description="Range of days, e.g. '7d', '30d'"),
    db: DBSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Hour of day with most interruptions.
    """
    range_days = _parse_range_days(range)
    return get_peak_distraction_hour(user_id=current_user.id, db=db, range_days=range_days)

@router.get("/weekly-pattern")
def stats_weekly_pattern(
    range: str = Query("7d", description="Range of days, e.g. '7d', '30d'"),
    db: DBSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Weekly work pattern.
    """
    range_days = _parse_range_days(range)
    return get_weekly_pattern(user_id=current_user.id, db=db, range_days=range_days)

@router.get("/insights")
def get_insights(
    db: DBSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get AI-generated insights based on user stats.
    """
    from app.core.stats_logic import generate_ai_insights
    return generate_ai_insights(user_id=current_user.id, db=db)
