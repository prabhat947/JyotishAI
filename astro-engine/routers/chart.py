from fastapi import APIRouter, HTTPException
from datetime import datetime
from typing import List

from schemas.birth_data import (
    BirthData, ChartData, Planet, House, TransitData,
    TransitVsNatalData, TransitAspect
)
from core import calculator
from core.nakshatra import get_nakshatra
from core.dasha import calc_dasha_balance, get_dasha_sequence
from core.yoga_rules import detect_yogas
from core.ashtakavarga import calc_ashtakavarga

router = APIRouter(prefix="/chart", tags=["chart"])


@router.post("/", response_model=ChartData)
async def calculate_chart(birth_data: BirthData):
    """
    Calculate complete birth chart from birth data

    Args:
        birth_data: Birth information (date, time, location)

    Returns:
        Complete ChartData with planets, houses, dashas, yogas
    """
    try:
        # Combine date and time
        birth_datetime = datetime.combine(birth_data.birth_date, birth_data.birth_time)

        # Calculate Julian Day
        # Assuming IST (UTC+5:30) as default
        utc_offset = 5.5
        jd = calculator.calc_julian_day(birth_datetime, utc_offset)

        # Get ayanamsha
        ayanamsha = calculator.get_ayanamsha(jd)

        # Calculate planetary positions
        positions = calculator.calc_planetary_positions(jd)

        # Calculate lagna
        lagna_degree = calculator.calc_lagna(
            jd,
            birth_data.latitude,
            birth_data.longitude
        )

        # Calculate houses (Whole Sign)
        houses_data = calculator.calc_houses(lagna_degree)

        # Build Planet objects
        planets = []
        for planet_name, pos_data in positions.items():
            longitude = pos_data['longitude']
            sign = calculator.get_sign_from_longitude(longitude)
            sign_lord = calculator.SIGN_LORDS[sign]
            degree_in_sign = calculator.get_degree_in_sign(longitude)
            house = calculator.get_planet_house(longitude, lagna_degree)
            nakshatra_info = get_nakshatra(longitude)
            dignity = calculator.get_planet_dignity(planet_name, longitude)

            planet = Planet(
                name=planet_name,
                longitude=longitude,
                latitude=pos_data['latitude'],
                speed=pos_data['speed'],
                sign=sign,
                sign_lord=sign_lord,
                degree_in_sign=degree_in_sign,
                house=house,
                nakshatra=nakshatra_info['name'],
                nakshatra_lord=nakshatra_info['lord'],
                pada=nakshatra_info['pada'],
                is_retrograde=pos_data['is_retrograde'],
                dignity=dignity
            )
            planets.append(planet)

        # Add planets to houses
        houses = []
        for house_data in houses_data:
            planets_in_house = [
                p.name for p in planets if p.house == house_data['number']
            ]
            house = House(
                number=house_data['number'],
                sign=house_data['sign'],
                lord=house_data['lord'],
                cusp=house_data['cusp'],
                planets=planets_in_house
            )
            houses.append(house)

        # Create lagna as Planet object
        lagna_sign = calculator.get_sign_from_longitude(lagna_degree)
        lagna_nakshatra_info = get_nakshatra(lagna_degree)

        lagna = Planet(
            name='Lagna',
            longitude=lagna_degree,
            latitude=0.0,
            speed=0.0,
            sign=lagna_sign,
            sign_lord=calculator.SIGN_LORDS[lagna_sign],
            degree_in_sign=calculator.get_degree_in_sign(lagna_degree),
            house=1,
            nakshatra=lagna_nakshatra_info['name'],
            nakshatra_lord=lagna_nakshatra_info['lord'],
            pada=lagna_nakshatra_info['pada'],
            is_retrograde=False,
            dignity='neutral'
        )

        # Calculate Vimshottari Dasha
        moon_longitude = next(p.longitude for p in planets if p.name == 'Moon')
        balance_info = calc_dasha_balance(moon_longitude, birth_datetime)
        dasha_sequence = get_dasha_sequence(birth_datetime, balance_info)

        from schemas.birth_data import DashaPeriod, DashaSequence

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

        dasha_at_birth = DashaSequence(
            birth_date=birth_datetime,
            balance_at_birth={
                'nakshatra_lord': balance_info['nakshatra_lord'],
                'balance_years': balance_info['balance_years']
            },
            periods=dasha_periods
        )

        # Build ChartData object (without yogas for now)
        chart_data = ChartData(
            birth_info=birth_data,
            julian_day=jd,
            ayanamsha=ayanamsha,
            lagna=lagna,
            planets=planets,
            houses=houses,
            dasha_at_birth=dasha_at_birth,
            yogas=[],
            ashtakavarga=[]
        )

        # Detect yogas
        yogas = detect_yogas(chart_data)
        chart_data.yogas = yogas

        # Calculate Ashtakavarga
        ashtakavarga = calc_ashtakavarga(chart_data)
        chart_data.ashtakavarga = ashtakavarga

        return chart_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chart calculation error: {str(e)}")


@router.get("/transits", response_model=TransitData)
async def get_current_transits():
    """
    Get current planetary positions (transits)

    Returns:
        TransitData with current planetary positions
    """
    try:
        now = datetime.utcnow()
        jd = calculator.calc_julian_day(now, utc_offset_hours=0)  # UTC

        positions = calculator.calc_planetary_positions(jd)

        planets = []
        for planet_name, pos_data in positions.items():
            longitude = pos_data['longitude']
            sign = calculator.get_sign_from_longitude(longitude)
            sign_lord = calculator.SIGN_LORDS[sign]
            degree_in_sign = calculator.get_degree_in_sign(longitude)
            nakshatra_info = get_nakshatra(longitude)

            planet = Planet(
                name=planet_name,
                longitude=longitude,
                latitude=pos_data['latitude'],
                speed=pos_data['speed'],
                sign=sign,
                sign_lord=sign_lord,
                degree_in_sign=degree_in_sign,
                house=1,  # Not applicable for transits without natal chart
                nakshatra=nakshatra_info['name'],
                nakshatra_lord=nakshatra_info['lord'],
                pada=nakshatra_info['pada'],
                is_retrograde=pos_data['is_retrograde'],
                dignity='neutral'
            )
            planets.append(planet)

        return TransitData(
            calculated_at=now,
            julian_day=jd,
            planets=planets
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transit calculation error: {str(e)}")


@router.post("/transits/natal", response_model=TransitVsNatalData)
async def calculate_transits_vs_natal(natal_chart: ChartData):
    """
    Calculate current transits in relation to natal chart

    Args:
        natal_chart: The natal birth chart

    Returns:
        TransitVsNatalData with aspects between transiting and natal planets
    """
    try:
        # Get current transits
        current_transits = await get_current_transits()

        # Calculate aspects
        aspects = []
        significant_transits = []

        transit_planets = {p.name: p for p in current_transits.planets}
        natal_planets = {p.name: p for p in natal_chart.planets}

        for transit_name, transit_planet in transit_planets.items():
            for natal_name, natal_planet in natal_planets.items():
                diff = abs(transit_planet.longitude - natal_planet.longitude)
                if diff > 180:
                    diff = 360 - diff

                # Determine aspect type
                aspect_type = None
                orb_tolerance = 5.0  # degrees

                if diff <= orb_tolerance:
                    aspect_type = 'conjunction'
                elif abs(diff - 60) <= orb_tolerance:
                    aspect_type = 'sextile'
                elif abs(diff - 90) <= orb_tolerance:
                    aspect_type = 'square'
                elif abs(diff - 120) <= orb_tolerance:
                    aspect_type = 'trine'
                elif abs(diff - 180) <= orb_tolerance:
                    aspect_type = 'opposition'

                if aspect_type:
                    is_exact = diff <= 1.0 or abs(diff - 60) <= 1.0 or abs(diff - 90) <= 1.0 or abs(diff - 120) <= 1.0 or abs(diff - 180) <= 1.0

                    aspect = TransitAspect(
                        transit_planet=transit_name,
                        natal_planet=natal_name,
                        aspect_type=aspect_type,
                        orb=diff,
                        is_exact=is_exact
                    )
                    aspects.append(aspect)

                    # Significant transits
                    if transit_name in ['Saturn', 'Jupiter', 'Rahu', 'Ketu'] and aspect_type in ['conjunction', 'opposition']:
                        significant_transits.append(
                            f"Transiting {transit_name} {aspect_type} natal {natal_name} (orb: {diff:.2f}°)"
                        )

        return TransitVsNatalData(
            natal_chart=natal_chart,
            current_transits=current_transits,
            aspects=aspects,
            significant_transits=significant_transits
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transit vs natal calculation error: {str(e)}")
