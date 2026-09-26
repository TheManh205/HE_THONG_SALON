from app.models.user import RoleEnum
from typing import List, Optional
from datetime import time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.hairdresser import Hairdresser, Schedule
from app.models.hairdresser import Hairdresser, Schedule, DailySchedule
from app.models.user import User
from app.schemas.hairdresser import (
    HairdresserCreate,
    HairdresserUpdate,
    HairdresserResponse,
    ScheduleBase,
    ScheduleCreate,
    ScheduleResponse
)
from app.services.auth_service import require_roles

router = APIRouter(prefix="/hairdressers", tags=["Hairdresser & Schedule Management"])

@router.get("/", response_model=List[HairdresserResponse])
def get_hairdressers(
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """List all hairdressers/stylists with their work schedules (Publicly accessible for booking)."""
    query = db.query(Hairdresser)
    if active_only:
        query = query.filter(Hairdresser.is_active == True)
    return query.all()

@router.get("/{hairdresser_id}", response_model=HairdresserResponse)
def get_hairdresser(hairdresser_id: int, db: Session = Depends(get_db)):
    hairdresser = db.query(Hairdresser).filter(Hairdresser.id == hairdresser_id).first()
    if not hairdresser:
        raise HTTPException(status_code=404, detail="Không tìm thấy thợ làm tóc")
    return hairdresser

@router.post("/", response_model=HairdresserResponse, status_code=status.HTTP_201_CREATED)
def create_hairdresser(
    hairdresser_in: HairdresserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN]))
):
    """Create new hairdresser profile and generate standard weekly schedule (Admin only)."""
    hairdresser = Hairdresser(
        user_id=hairdresser_in.user_id,
        full_name=hairdresser_in.full_name,
        phone=hairdresser_in.phone,
        bio=hairdresser_in.bio,
        avatar_url=hairdresser_in.avatar_url,
        rating=hairdresser_in.rating or 5.0,
        is_active=hairdresser_in.is_active if hairdresser_in.is_active is not None else True
    )
    db.add(hairdresser)
    db.flush()

    # Create schedules (0 to 6)
    if hairdresser_in.schedules:
        for sched in hairdresser_in.schedules:
            s = Schedule(
                hairdresser_id=hairdresser.id,
                day_of_week=sched.day_of_week,
                start_time=sched.start_time,
                end_time=sched.end_time,
                is_day_off=sched.is_day_off
            )
            db.add(s)
    else:
        # Default Mon-Sun schedule (8:30 to 20:00, off on Monday)
        for dow in range(7):
            s = Schedule(
                hairdresser_id=hairdresser.id,
                day_of_week=dow,
                start_time=time(8, 30),
                end_time=time(20, 0),
                is_day_off=(dow == 0) # Day off on Monday
            )
            db.add(s)

    db.commit()
    db.refresh(hairdresser)
    return hairdresser

@router.put("/{hairdresser_id}", response_model=HairdresserResponse)
def update_hairdresser(
    hairdresser_id: int,
    hairdresser_update: HairdresserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN]))
):
    hairdresser = db.query(Hairdresser).filter(Hairdresser.id == hairdresser_id).first()
    if not hairdresser:
        raise HTTPException(status_code=404, detail="Không tìm thấy thợ làm tóc")

    for key, value in hairdresser_update.model_dump(exclude_unset=True).items():
        setattr(hairdresser, key, value)

    db.commit()
    db.refresh(hairdresser)
    return hairdresser

@router.put("/{hairdresser_id}/schedules", response_model=List[ScheduleResponse])
def update_hairdresser_schedules(
    hairdresser_id: int,
    schedules_in: List[ScheduleBase],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN]))
):
    """Update full weekly work schedule for a stylist."""
    hairdresser = db.query(Hairdresser).filter(Hairdresser.id == hairdresser_id).first()
    if not hairdresser:
        raise HTTPException(status_code=404, detail="Không tìm thấy thợ làm tóc")

    # Clear old schedules
    db.query(Schedule).filter(Schedule.hairdresser_id == hairdresser_id).delete()

    created_schedules = []
    for sched in schedules_in:
        s = Schedule(
            hairdresser_id=hairdresser_id,
            day_of_week=sched.day_of_week,
            start_time=sched.start_time,
            end_time=sched.end_time,
            is_day_off=sched.is_day_off
        )
        db.add(s)
        created_schedules.append(s)

    db.commit()
    return created_schedules


@router.put("/{hairdresser_id}/daily-schedule", response_model=ScheduleResponse)
def upsert_daily_schedule(
    hairdresser_id: int,
    sched_in: ScheduleBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN]))
):
    """Upsert a daily schedule override for a specific date (Admin only)."""
    # sched_in.day_of_week will be ignored; expect schedule_date provided as ISO date in additional param
    from datetime import datetime
    # client must send schedule_date as additional field inside request body under 'schedule_date' key
    data = sched_in.model_dump()
    schedule_date_str = (sched_in.__dict__.get('schedule_date') or None)
    if not schedule_date_str:
        raise HTTPException(status_code=400, detail="Missing schedule_date (YYYY-MM-DD)")
    try:
        sd = datetime.strptime(schedule_date_str, "%Y-%m-%d").date()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid schedule_date format, expected YYYY-MM-DD")

    daily = db.query(DailySchedule).filter(
        DailySchedule.hairdresser_id == hairdresser_id,
        DailySchedule.schedule_date == sd
    ).first()

    if daily:
        daily.start_time = sched_in.start_time
        daily.end_time = sched_in.end_time
        daily.is_day_off = sched_in.is_day_off
    else:
        daily = DailySchedule(
            hairdresser_id=hairdresser_id,
            schedule_date=sd,
            start_time=sched_in.start_time,
            end_time=sched_in.end_time,
            is_day_off=sched_in.is_day_off
        )
        db.add(daily)

    db.commit()
    db.refresh(daily)
    # Return a ScheduleResponse-like object
    return ScheduleResponse.model_validate({
        "id": daily.id,
        "hairdresser_id": daily.hairdresser_id,
        "day_of_week": sd.weekday(),
        "start_time": daily.start_time,
        "end_time": daily.end_time,
        "is_day_off": daily.is_day_off
    })
