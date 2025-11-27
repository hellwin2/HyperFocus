from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple

from sqlmodel import Session, select

from app.models import Session as WorkSession, Interruption


def _get_range_dates(range_days: int) -> Tuple[datetime, datetime]:
    """Returns (since, now) as timezone-aware UTC datetimes."""
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=range_days)
    return since, now


def _get_sessions_in_range(
    user_id: int, db: Session, since: datetime, now: datetime
) -> List[WorkSession]:
    """Fetches sessions that started within the range."""
    query = select(WorkSession).where(
        WorkSession.user_id == user_id,
        WorkSession.start_time >= since,
    )
    return db.exec(query).all()


def _get_interruptions_in_range(
    user_id: int, db: Session, since: datetime
) -> List[Interruption]:
    """Fetches interruptions that started within the range."""
    query = select(Interruption).where(
        Interruption.user_id == user_id,
        Interruption.start_time >= since,
    )
    return db.exec(query).all()


def _ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Ensures a datetime object is timezone-aware (UTC)."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def get_summary_stats(
    user_id: int,
    db: Session,
    range_days: int = 7,
) -> Dict:
    """
    Calculates general user statistics for a given date range.
    """
    since, now = _get_range_dates(range_days)
    sessions = _get_sessions_in_range(user_id, db, since, now)
    interruptions = _get_interruptions_in_range(user_id, db, since)

    total_sessions = len(sessions)
    total_interruptions = len(interruptions)

    total_time_worked_seconds = 0.0
    for s in sessions:
        if s.end_time:
            delta = (s.end_time - s.start_time).total_seconds()
            if delta > 0:
                total_time_worked_seconds += delta

    total_time_lost_seconds = 0.0
    for it in interruptions:
        if it.duration and it.duration > 0:
            total_time_lost_seconds += it.duration

    effective_time_seconds = max(total_time_worked_seconds - total_time_lost_seconds, 0.0)

    average_interruption_duration_seconds = 0.0
    if total_interruptions > 0:
        average_interruption_duration_seconds = total_time_lost_seconds / total_interruptions

    interruptions_per_hour = 0.0
    if effective_time_seconds > 0:
        hours_effective = effective_time_seconds / 3600.0
        interruptions_per_hour = total_interruptions / hours_effective

    return {
        "user_id": user_id,
        "range_days": range_days,
        "total_sessions": total_sessions,
        "total_interruptions": total_interruptions,
        "total_time_worked_seconds": int(total_time_worked_seconds),
        "total_time_lost_seconds": int(total_time_lost_seconds),
        "effective_time_seconds": int(effective_time_seconds),
        "average_interruption_duration_seconds": average_interruption_duration_seconds,
        "interruptions_per_hour": interruptions_per_hour,
    }


def get_interruption_type_stats(
    user_id: int,
    db: Session,
    range_days: int = 7,
) -> Dict:
    """
    Calculates interruption statistics by type.
    """
    since, _ = _get_range_dates(range_days)
    interruptions = _get_interruptions_in_range(user_id, db, since)

    counts: Dict[str, int] = {}
    for it in interruptions:
        it_type = it.type or "unknown"
        counts[it_type] = counts.get(it_type, 0) + 1

    total_interruptions = sum(counts.values())

    proportions = {}
    if total_interruptions > 0:
        proportions = {t: c / total_interruptions for t, c in counts.items()}
    else:
        proportions = {t: 0.0 for t in counts}

    return {
        "user_id": user_id,
        "range_days": range_days,
        "counts": counts,
        "proportions": proportions,
        "total_interruptions": total_interruptions,
    }


def get_productive_hours_stats(
    user_id: int,
    db: Session,
    range_days: int = 7,
) -> Dict:
    """
    Calculates work time and interruptions per hour of day (0-23).
    """
    since, now = _get_range_dates(range_days)
    
    # Only finished sessions for hourly calculation
    sessions_query = select(WorkSession).where(
        WorkSession.user_id == user_id,
        WorkSession.start_time >= since,
        WorkSession.end_time.is_not(None),
    )
    sessions = db.exec(sessions_query).all()
    
    interruptions = _get_interruptions_in_range(user_id, db, since)

    hours_data = {h: {"work_seconds": 0.0, "interruptions": 0} for h in range(24)}

    # 1. Distribute session time across hours
    for s in sessions:
        start = _ensure_utc(s.start_time)
        end = _ensure_utc(s.end_time)

        if not start or not end: continue
        if end <= since or start >= now: continue

        start = max(start, since)
        end = min(end, now)
        if end <= start: continue

        current = start
        while current < end:
            hour_start = current
            next_hour = (hour_start.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1))
            chunk_end = min(end, next_hour)
            delta = (chunk_end - hour_start).total_seconds()

            if delta > 0:
                hours_data[hour_start.hour]["work_seconds"] += delta
            
            current = chunk_end

    # 2. Count interruptions by start hour
    for it in interruptions:
        it_start = _ensure_utc(it.start_time)
        if it_start:
            hours_data[it_start.hour]["interruptions"] += 1

    # 3. Format response
    hours_list: List[dict] = []
    for h in range(24):
        work_seconds = hours_data[h]["work_seconds"]
        interruptions_count = hours_data[h]["interruptions"]
        
        interruptions_per_hour = 0.0
        if work_seconds > 0:
            interruptions_per_hour = interruptions_count / (work_seconds / 3600.0)

        # Calculate a simple productivity score (0-100)
        # Base 100, minus penalty for interruptions per hour
        productivity_score = 0
        if work_seconds > 0:
            productivity_score = max(100 - (interruptions_per_hour * 10), 0)

        hours_list.append({
            "hour": h,
            "work_seconds": int(work_seconds),
            "interruptions": interruptions_count,
            "interruptions_per_hour": interruptions_per_hour,
            "productivity_score": int(productivity_score)
        })

    return {
        "user_id": user_id,
        "range_days": range_days,
        "hours": hours_list,
    }


def get_peak_distraction_hour(
    user_id: int,
    db: Session,
    range_days: int = 7,
) -> Dict:
    """
    Finds the hour of day with the most interruptions.
    """
    since, _ = _get_range_dates(range_days)
    interruptions = _get_interruptions_in_range(user_id, db, since)

    interruptions_per_hour = {h: 0 for h in range(24)}
    total_interruptions = 0

    for it in interruptions:
        it_start = _ensure_utc(it.start_time)
        if it_start:
            interruptions_per_hour[it_start.hour] += 1
            total_interruptions += 1

    peak_hour = None
    peak_interruptions = 0
    
    if total_interruptions > 0:
        peak_hour = max(interruptions_per_hour, key=interruptions_per_hour.get)
        peak_interruptions = interruptions_per_hour[peak_hour]

    return {
        "user_id": user_id,
        "range_days": range_days,
        "peak_hour": peak_hour,
        "peak_interruptions": peak_interruptions,
        "total_interruptions": total_interruptions,
    }


def get_weekly_pattern(
    user_id: int,
    db: Session,
    range_days: int = 7,
) -> Dict:
    """
    Calculates weekly work and interruption patterns.
    """
    since, now = _get_range_dates(range_days)
    
    sessions_query = select(WorkSession).where(
        WorkSession.user_id == user_id,
        WorkSession.start_time >= since,
        WorkSession.end_time.is_not(None),
    )
    sessions = db.exec(sessions_query).all()
    
    interruptions = _get_interruptions_in_range(user_id, db, since)

    weekly_data = {
        i: {"work_seconds": 0.0, "time_lost_seconds": 0.0, "interruptions": 0}
        for i in range(7)
    }

    # 1. Distribute sessions
    for s in sessions:
        start = _ensure_utc(s.start_time)
        end = _ensure_utc(s.end_time)

        if not start or not end: continue
        if end <= since or start >= now: continue

        start = max(start, since)
        end = min(end, now)
        if end <= start: continue

        current = start
        while current < end:
            day_start = current
            next_day = (day_start.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1))
            chunk_end = min(end, next_day)
            delta = (chunk_end - day_start).total_seconds()

            if delta > 0:
                weekly_data[day_start.weekday()]["work_seconds"] += delta
            
            current = chunk_end

    # 2. Distribute interruptions
    for it in interruptions:
        it_start = _ensure_utc(it.start_time)
        if it_start:
            idx = it_start.weekday()
            weekly_data[idx]["interruptions"] += 1
            if it.duration and it.duration > 0:
                weekly_data[idx]["time_lost_seconds"] += it.duration

    weekday_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    days_list = []
    
    for i in range(7):
        work = weekly_data[i]["work_seconds"]
        lost = weekly_data[i]["time_lost_seconds"]
        effective = max(work - lost, 0.0)
        
        days_list.append({
            "weekday_index": i,
            "day": weekday_names[i], # Short name for charts
            "work_seconds": int(work),
            "time_lost_seconds": int(lost),
            "effective_time_seconds": int(effective),
            "interruptions": weekly_data[i]["interruptions"],
            # For charts:
            "sessions": round(work / 3600, 1), # Hours
            "lost": round(lost / 3600, 1)      # Hours
        })

    return {
        "user_id": user_id,
        "range_days": range_days,
        "days": days_list,
    }

def generate_ai_insights(
    user_id: int,
    db: Session,
) -> List[Dict]:
    """
    Generates a list of 'AI' insights based on user stats.
    """
    insights = []
    
    # 1. Analyze Peak Hours (Productivity)
    productive_stats = get_productive_hours_stats(user_id, db, range_days=30)
    hours = productive_stats["hours"]
    
    # Find top 3 hours by work volume
    sorted_hours = sorted(hours, key=lambda x: x["work_seconds"], reverse=True)
    top_hours = sorted_hours[:3]
    
    if top_hours and top_hours[0]["work_seconds"] > 3600: # At least 1 hour of data
        best_hour = top_hours[0]["hour"]
        
        if 5 <= best_hour < 12:
            insights.append({
                "type": "productivity",
                "title": "Morning Person 🌅",
                "description": f"You are most productive around {best_hour}:00. Try to schedule your hardest tasks then!",
                "score": 90
            })
        elif 12 <= best_hour < 18:
            insights.append({
                "type": "productivity",
                "title": "Afternoon Warrior ☀️",
                "description": f"Your focus peaks around {best_hour}:00. Perfect time for deep work.",
                "score": 90
            })
        else:
            insights.append({
                "type": "productivity",
                "title": "Night Owl 🦉",
                "description": f"You find your flow late at night around {best_hour}:00. Embrace the quiet!",
                "score": 90
            })

    # 2. Analyze Distractions
    interruption_stats = get_interruption_type_stats(user_id, db, range_days=7)
    counts = interruption_stats["counts"]
    
    if counts:
        top_distractor = max(counts, key=counts.get)
        count = counts[top_distractor]
        
        if count > 5:
            insights.append({
                "type": "warning",
                "title": f"Distraction Alert: {top_distractor} ⚠️",
                "description": f"'{top_distractor}' interrupted you {count} times this week. Consider blocking it.",
                "score": 70
            })

    # 3. Weekly Consistency
    weekly_stats = get_weekly_pattern(user_id, db, range_days=14)
    days = weekly_stats["days"]
    
    # Find most productive day
    best_day = max(days, key=lambda x: x["work_seconds"])
    if best_day["work_seconds"] > 7200: # > 2 hours
        insights.append({
            "type": "success",
            "title": f"{best_day['day']} is your Power Day ⚡",
            "description": "You consistently crush it on this day. Keep the momentum going!",
            "score": 85
        })

    # 4. Weekend Warrior Check
    weekend_work = sum(d["work_seconds"] for d in days if d["weekday_index"] >= 5)
    if weekend_work > 10800: # > 3 hours on weekends
        insights.append({
            "type": "info",
            "title": "Weekend Warrior 🛡️",
            "description": "You put in significant time on weekends. Don't forget to rest!",
            "score": 60
        })

    # Fallback if no data
    if not insights:
        insights.append({
            "type": "info",
            "title": "Gathering Data 📊",
            "description": "Keep tracking your sessions! I need a bit more data to generate personalized insights.",
            "score": 50
        })

    return insights
