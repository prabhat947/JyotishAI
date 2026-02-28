from fastapi import APIRouter, HTTPException
from datetime import datetime
from typing import Dict, List

try:
    from zoneinfo import ZoneInfo
except ImportError:
    from backports.zoneinfo import ZoneInfo

from schemas.birth_data import BirthData, DashaPeriod, DashaSequence
from core.dasha import (
    calc_dasha_balance,
    get_dasha_sequence,
    get_antardasha,
    get_pratyantardasha,
    get_current_dasha
)
from core import calculator
from core.nakshatra import get_nakshatra

router = APIRouter(prefix="/dasha", tags=["dasha"])


@router.post("", response_model=DashaSequence)
async def calculate_dasha(birth_data: BirthData):
    """
    Calculate Vimshottari Dasha sequence from birth data

    Args:
        birth_data: Birth information

    Returns:
        Complete DashaSequence with 120-year periods
    """
    try:
        # Combine date and time
        birth_datetime = datetime.combine(birth_data.birth_date, birth_data.birth_time)

        # Calculate Julian Day using actual timezone from birth data
        tz = ZoneInfo(birth_data.timezone)
        birth_dt_aware = birth_datetime.replace(tzinfo=tz)
        utc_offset_hours = birth_dt_aware.utcoffset().total_seconds() / 3600
        jd = calculator.calc_julian_day(birth_datetime, utc_offset_hours)

        # Calculate Moon position
        positions = calculator.calc_planetary_positions(jd)
        moon_longitude = positions['Moon']['longitude']

        # Calculate dasha balance
        balance_info = calc_dasha_balance(moon_longitude, birth_datetime)

        # Get dasha sequence
        dasha_sequence = get_dasha_sequence(birth_datetime, balance_info)

        # Convert to Pydantic models
        dasha_periods = [
            DashaPeriod(
                planet=d['planet'],
                start_date=datetime.fromisoformat(d['start_date']),
                end_date=datetime.fromisoformat(d['end_date']),
                level=d['level'],
                parent_planet=d.get('parent_planet')
            )
            for d in dasha_sequence
        ]

        return DashaSequence(
            birth_date=birth_datetime,
            balance_at_birth={
                'nakshatra_lord': balance_info['nakshatra_lord'],
                'balance_years': balance_info['balance_years'],
                'nakshatra_name': balance_info['nakshatra_name']
            },
            periods=dasha_periods
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dasha calculation error: {str(e)}")


@router.post("/current")
async def get_current_dasha_periods(birth_data: BirthData, date: datetime = None):
    """
    Get current mahadasha, antardasha, pratyantardasha for a given date

    Args:
        birth_data: Birth information
        date: Date to check (defaults to today)

    Returns:
        Dict with current periods at all three levels
    """
    try:
        if date is None:
            date = datetime.now()

        # Calculate dasha sequence
        dasha_result = await calculate_dasha(birth_data)

        # Convert DashaPeriod to dict format expected by get_current_dasha
        sequence = [
            {
                'planet': p.planet,
                'start_date': p.start_date.isoformat(),
                'end_date': p.end_date.isoformat(),
                'level': p.level
            }
            for p in dasha_result.periods
        ]

        # Get current periods
        current = get_current_dasha(sequence, date)

        if not current:
            raise HTTPException(status_code=404, detail="No dasha found for given date")

        return {
            'date': date.isoformat(),
            'mahadasha': current['mahadasha'],
            'antardasha': current['antardasha'],
            'pratyantardasha': current['pratyantardasha']
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Current dasha calculation error: {str(e)}")


@router.get("/antardasha/{mahadasha_planet}")
async def get_antardasha_periods(
    mahadasha_planet: str,
    start_date: datetime,
    end_date: datetime
):
    """
    Get all antardasha periods within a mahadasha

    Args:
        mahadasha_planet: Name of mahadasha lord
        start_date: Mahadasha start date
        end_date: Mahadasha end date

    Returns:
        List of antardasha periods
    """
    try:
        antardashas = get_antardasha(mahadasha_planet, start_date, end_date)

        return {
            'mahadasha_planet': mahadasha_planet,
            'mahadasha_start': start_date.isoformat(),
            'mahadasha_end': end_date.isoformat(),
            'antardashas': antardashas
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Antardasha calculation error: {str(e)}")


@router.get("/pratyantardasha/{mahadasha_planet}/{antardasha_planet}")
async def get_pratyantardasha_periods(
    mahadasha_planet: str,
    antardasha_planet: str,
    start_date: datetime,
    end_date: datetime
):
    """
    Get all pratyantardasha periods within an antardasha

    Args:
        mahadasha_planet: Name of mahadasha lord
        antardasha_planet: Name of antardasha lord
        start_date: Antardasha start date
        end_date: Antardasha end date

    Returns:
        List of pratyantardasha periods
    """
    try:
        pratyantars = get_pratyantardasha(
            mahadasha_planet,
            antardasha_planet,
            start_date,
            end_date
        )

        return {
            'mahadasha_planet': mahadasha_planet,
            'antardasha_planet': antardasha_planet,
            'antardasha_start': start_date.isoformat(),
            'antardasha_end': end_date.isoformat(),
            'pratyantardashas': pratyantars
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pratyantardasha calculation error: {str(e)}")
