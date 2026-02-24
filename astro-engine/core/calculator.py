import swisseph as swe
from datetime import datetime, timezone, timedelta
from typing import Dict, Tuple, List
import os

# Initialize Swiss Ephemeris
EPHE_PATH = os.path.join(os.path.dirname(__file__), '..', 'ephe')
swe.set_ephe_path(EPHE_PATH)

# Set sidereal mode to Lahiri (Chitrapaksha) ayanamsha
swe.set_sid_mode(swe.SIDM_LAHIRI)

# Planet constants
PLANETS = {
    'Sun': swe.SUN,
    'Moon': swe.MOON,
    'Mars': swe.MARS,
    'Mercury': swe.MERCURY,
    'Jupiter': swe.JUPITER,
    'Venus': swe.VENUS,
    'Saturn': swe.SATURN,
    'Rahu': swe.MEAN_NODE,  # North node
    'Ketu': swe.MEAN_NODE,  # Will be 180° opposite to Rahu
}

# Zodiac signs
SIGNS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer',
    'Leo', 'Virgo', 'Libra', 'Scorpio',
    'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
]

# Sign lords (Vedic)
SIGN_LORDS = {
    'Aries': 'Mars',
    'Taurus': 'Venus',
    'Gemini': 'Mercury',
    'Cancer': 'Moon',
    'Leo': 'Sun',
    'Virgo': 'Mercury',
    'Libra': 'Venus',
    'Scorpio': 'Mars',
    'Sagittarius': 'Jupiter',
    'Capricorn': 'Saturn',
    'Aquarius': 'Saturn',
    'Pisces': 'Jupiter'
}

# Exaltation/Debilitation
EXALTATION = {
    'Sun': ('Aries', 10.0),
    'Moon': ('Taurus', 3.0),
    'Mars': ('Capricorn', 28.0),
    'Mercury': ('Virgo', 15.0),
    'Jupiter': ('Cancer', 5.0),
    'Venus': ('Pisces', 27.0),
    'Saturn': ('Libra', 20.0),
    'Rahu': ('Taurus', 20.0),
    'Ketu': ('Scorpio', 20.0)
}

DEBILITATION = {
    'Sun': ('Libra', 10.0),
    'Moon': ('Scorpio', 3.0),
    'Mars': ('Cancer', 28.0),
    'Mercury': ('Pisces', 15.0),
    'Jupiter': ('Capricorn', 5.0),
    'Venus': ('Virgo', 27.0),
    'Saturn': ('Aries', 20.0),
    'Rahu': ('Scorpio', 20.0),
    'Ketu': ('Taurus', 20.0)
}


def calc_julian_day(dt: datetime, utc_offset_hours: float = 5.5) -> float:
    """Calculate Julian Day from datetime"""
    # Convert to UTC
    utc_dt = dt - timedelta(hours=utc_offset_hours)

    year = utc_dt.year
    month = utc_dt.month
    day = utc_dt.day
    hour = utc_dt.hour + utc_dt.minute / 60.0 + utc_dt.second / 3600.0

    jd = swe.julday(year, month, day, hour)
    return jd


def get_ayanamsha(jd: float) -> float:
    """Get Lahiri ayanamsha for given Julian Day"""
    return swe.get_ayanamsa_ut(jd)


def calc_planetary_positions(jd: float) -> Dict[str, Dict]:
    """Calculate positions for all planets"""
    positions = {}

    for planet_name, planet_id in PLANETS.items():
        if planet_name == 'Ketu':
            # Ketu is 180° opposite to Rahu
            rahu_data = positions['Rahu']
            ketu_long = (rahu_data['longitude'] + 180.0) % 360.0
            positions['Ketu'] = {
                'longitude': ketu_long,
                'latitude': -rahu_data['latitude'],
                'speed': -rahu_data['speed'],
                'is_retrograde': rahu_data['is_retrograde']
            }
            continue

        # Calculate sidereal position
        result, flags = swe.calc_ut(jd, planet_id, swe.FLG_SIDEREAL | swe.FLG_SPEED)

        longitude = result[0]
        latitude = result[1]
        speed = result[3]

        # Check retrograde (speed < 0 for direct motion planets)
        # Rahu/Ketu are always retrograde in mean node calculation
        is_retrograde = speed < 0 if planet_name not in ['Rahu', 'Ketu'] else True

        positions[planet_name] = {
            'longitude': longitude,
            'latitude': latitude,
            'speed': speed,
            'is_retrograde': is_retrograde
        }

    return positions


def calc_lagna(jd: float, lat: float, lon: float) -> float:
    """Calculate Ascendant (Lagna) degree"""
    # Calculate houses using Placidus (to get ascendant)
    # Then we'll use whole sign houses separately
    cusps, ascmc = swe.houses_ex(jd, lat, lon, b'P')  # Placidus

    ascendant_tropical = ascmc[0]

    # Convert to sidereal
    ayanamsha = get_ayanamsha(jd)
    ascendant_sidereal = (ascendant_tropical - ayanamsha) % 360.0

    return ascendant_sidereal


def calc_houses(lagna_degree: float) -> List[Dict]:
    """Calculate houses using Whole Sign system"""
    lagna_sign = int(lagna_degree / 30.0)

    houses = []
    for i in range(12):
        house_num = i + 1
        sign_num = (lagna_sign + i) % 12
        sign_name = SIGNS[sign_num]
        lord = SIGN_LORDS[sign_name]
        cusp = (sign_num * 30.0) % 360.0

        houses.append({
            'number': house_num,
            'sign': sign_name,
            'lord': lord,
            'cusp': cusp,
            'planets': []
        })

    return houses


def get_planet_house(planet_longitude: float, lagna_degree: float) -> int:
    """Determine which house a planet is in (Whole Sign)"""
    lagna_sign = int(lagna_degree / 30.0)
    planet_sign = int(planet_longitude / 30.0)

    house = ((planet_sign - lagna_sign) % 12) + 1
    return house


def get_sign_from_longitude(longitude: float) -> str:
    """Get zodiac sign from longitude"""
    sign_num = int(longitude / 30.0)
    return SIGNS[sign_num]


def get_degree_in_sign(longitude: float) -> float:
    """Get degree within sign (0-30)"""
    return longitude % 30.0


def get_planet_dignity(planet_name: str, longitude: float) -> str:
    """Determine planet's dignity (exalted, debilitated, own sign, etc.)"""
    sign = get_sign_from_longitude(longitude)
    degree = get_degree_in_sign(longitude)
    lord = SIGN_LORDS[sign]

    # Check exaltation
    if planet_name in EXALTATION:
        exalt_sign, exalt_degree = EXALTATION[planet_name]
        if sign == exalt_sign:
            # Within 1° of exact exaltation degree = exalted
            if abs(degree - exalt_degree) < 1.0 or abs(degree - exalt_degree) > 29.0:
                return 'exalted'
            return 'exalted'  # In exaltation sign

    # Check debilitation
    if planet_name in DEBILITATION:
        debil_sign, debil_degree = DEBILITATION[planet_name]
        if sign == debil_sign:
            if abs(degree - debil_degree) < 1.0 or abs(degree - debil_degree) > 29.0:
                return 'debilitated'
            return 'debilitated'

    # Check own sign
    if lord == planet_name:
        return 'own_sign'

    # Friend/Enemy relationships (simplified)
    friends = {
        'Sun': ['Moon', 'Mars', 'Jupiter'],
        'Moon': ['Sun', 'Mercury'],
        'Mars': ['Sun', 'Moon', 'Jupiter'],
        'Mercury': ['Sun', 'Venus'],
        'Jupiter': ['Sun', 'Moon', 'Mars'],
        'Venus': ['Mercury', 'Saturn'],
        'Saturn': ['Mercury', 'Venus'],
        'Rahu': ['Mercury', 'Venus', 'Saturn'],
        'Ketu': ['Mars', 'Jupiter']
    }

    enemies = {
        'Sun': ['Venus', 'Saturn'],
        'Moon': ['None'],
        'Mars': ['Mercury'],
        'Mercury': ['Moon'],
        'Jupiter': ['Mercury', 'Venus'],
        'Venus': ['Sun', 'Moon'],
        'Saturn': ['Sun', 'Moon', 'Mars'],
        'Rahu': ['Sun', 'Moon', 'Mars'],
        'Ketu': ['Sun', 'Moon']
    }

    if planet_name in friends and lord in friends[planet_name]:
        return 'friend'
    if planet_name in enemies and lord in enemies[planet_name]:
        return 'enemy'

    return 'neutral'


def is_retrograde(planet_name: str, jd: float) -> bool:
    """Check if planet is retrograde"""
    if planet_name == 'Sun' or planet_name == 'Moon':
        return False

    if planet_name in ['Rahu', 'Ketu']:
        return True  # Always retrograde in mean node calculation

    planet_id = PLANETS[planet_name]
    result, flags = swe.calc_ut(jd, planet_id, swe.FLG_SIDEREAL | swe.FLG_SPEED)
    speed = result[3]

    return speed < 0
