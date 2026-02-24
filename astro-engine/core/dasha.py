from datetime import datetime, timedelta
from typing import List, Dict
from .nakshatra import DASHA_YEARS, DASHA_ORDER, get_nakshatra, get_next_dasha_lord


def calc_dasha_balance(moon_longitude: float, birth_datetime: datetime) -> Dict[str, float]:
    """
    Calculate the balance (remaining years) of the birth nakshatra's dasha at birth

    Args:
        moon_longitude: Moon's sidereal longitude
        birth_datetime: Birth date and time

    Returns:
        Dict with nakshatra_lord and balance_years
    """
    nakshatra_info = get_nakshatra(moon_longitude)
    nakshatra_lord = nakshatra_info['lord']

    # Each nakshatra spans 13°20' (13.333333°)
    nakshatra_span = 13.333333

    # How far into the nakshatra is the Moon?
    position_in_nakshatra = moon_longitude - nakshatra_info['degree_range_start']

    # Fraction of nakshatra completed
    fraction_completed = position_in_nakshatra / nakshatra_span

    # Total years for this nakshatra's lord
    total_years = DASHA_YEARS[nakshatra_lord]

    # Balance = years left
    balance_years = total_years * (1 - fraction_completed)

    return {
        'nakshatra_lord': nakshatra_lord,
        'balance_years': balance_years,
        'nakshatra_name': nakshatra_info['name']
    }


def get_dasha_sequence(birth_datetime: datetime, balance_info: Dict) -> List[Dict]:
    """
    Generate complete Vimshottari mahadasha sequence for 120 years

    Args:
        birth_datetime: Birth date and time
        balance_info: Balance info from calc_dasha_balance

    Returns:
        List of dasha periods
    """
    nakshatra_lord = balance_info['nakshatra_lord']
    balance_years = balance_info['balance_years']

    sequence = []
    current_date = birth_datetime

    # Start with the birth nakshatra lord's remaining period
    lord_index = DASHA_ORDER.index(nakshatra_lord)

    # Total of 120 years in Vimshottari cycle
    total_years_covered = 0
    max_years = 120

    while total_years_covered < max_years:
        current_lord = DASHA_ORDER[lord_index % len(DASHA_ORDER)]

        # First dasha uses balance, rest use full years
        if len(sequence) == 0:
            years = balance_years
        else:
            years = DASHA_YEARS[current_lord]

        # Convert years to timedelta
        days = years * 365.25
        end_date = current_date + timedelta(days=days)

        sequence.append({
            'planet': current_lord,
            'start_date': current_date.isoformat(),
            'end_date': end_date.isoformat(),
            'years': years,
            'level': 'mahadasha'
        })

        current_date = end_date
        total_years_covered += years
        lord_index += 1

    return sequence


def get_antardasha(mahadasha_planet: str, start_date: datetime, end_date: datetime) -> List[Dict]:
    """
    Calculate antardasha (sub-periods) within a mahadasha

    Args:
        mahadasha_planet: The mahadasha lord
        start_date: Mahadasha start date
        end_date: Mahadasha end date

    Returns:
        List of antardasha periods
    """
    # Antardasha follows the same order as mahadasha
    # Starting with the mahadasha lord itself
    lord_index = DASHA_ORDER.index(mahadasha_planet)
    total_years = DASHA_YEARS[mahadasha_planet]

    antardashas = []
    current_date = start_date

    for i in range(9):  # 9 antardashas in each mahadasha
        antardasha_lord = DASHA_ORDER[(lord_index + i) % len(DASHA_ORDER)]

        # Proportional distribution
        # Antardasha years = (Mahadasha years × Antardasha lord years) / 120
        antardasha_years = (total_years * DASHA_YEARS[antardasha_lord]) / 120.0

        days = antardasha_years * 365.25
        antardasha_end = current_date + timedelta(days=days)

        antardashas.append({
            'planet': antardasha_lord,
            'start_date': current_date.isoformat(),
            'end_date': antardasha_end.isoformat(),
            'years': antardasha_years,
            'level': 'antardasha',
            'parent_planet': mahadasha_planet
        })

        current_date = antardasha_end

    return antardashas


def get_pratyantardasha(mahadasha_planet: str, antardasha_planet: str,
                        start_date: datetime, end_date: datetime) -> List[Dict]:
    """
    Calculate pratyantardasha (sub-sub-periods) within an antardasha

    Args:
        mahadasha_planet: The mahadasha lord
        antardasha_planet: The antardasha lord
        start_date: Antardasha start date
        end_date: Antardasha end date

    Returns:
        List of pratyantardasha periods
    """
    lord_index = DASHA_ORDER.index(antardasha_planet)
    total_mahadasha_years = DASHA_YEARS[mahadasha_planet]
    antardasha_years = (total_mahadasha_years * DASHA_YEARS[antardasha_planet]) / 120.0

    pratyantar = []
    current_date = start_date

    for i in range(9):
        pratyantar_lord = DASHA_ORDER[(lord_index + i) % len(DASHA_ORDER)]

        # Pratyantardasha years = (Antardasha years × Pratyantar lord years) / 120
        pratyantar_years = (antardasha_years * DASHA_YEARS[pratyantar_lord]) / 120.0

        days = pratyantar_years * 365.25
        pratyantar_end = current_date + timedelta(days=days)

        pratyantar.append({
            'planet': pratyantar_lord,
            'start_date': current_date.isoformat(),
            'end_date': pratyantar_end.isoformat(),
            'years': pratyantar_years,
            'level': 'pratyantardasha',
            'parent_planet': f"{mahadasha_planet}-{antardasha_planet}"
        })

        current_date = pratyantar_end

    return pratyantar


def get_current_dasha(sequence: List[Dict], date: datetime = None) -> Dict:
    """
    Find the current mahadasha, antardasha, and pratyantardasha for a given date

    Args:
        sequence: Full dasha sequence
        date: Date to check (defaults to now)

    Returns:
        Dict with current mahadasha, antardasha, pratyantardasha
    """
    if date is None:
        date = datetime.now()

    # Find current mahadasha
    current_mahadasha = None
    for dasha in sequence:
        start = datetime.fromisoformat(dasha['start_date'])
        end = datetime.fromisoformat(dasha['end_date'])
        if start <= date <= end:
            current_mahadasha = dasha
            break

    if not current_mahadasha:
        return None

    # Calculate antardashas for this mahadasha
    maha_start = datetime.fromisoformat(current_mahadasha['start_date'])
    maha_end = datetime.fromisoformat(current_mahadasha['end_date'])
    antardashas = get_antardasha(current_mahadasha['planet'], maha_start, maha_end)

    # Find current antardasha
    current_antardasha = None
    for antar in antardashas:
        start = datetime.fromisoformat(antar['start_date'])
        end = datetime.fromisoformat(antar['end_date'])
        if start <= date <= end:
            current_antardasha = antar
            break

    if not current_antardasha:
        return {
            'mahadasha': current_mahadasha,
            'antardasha': None,
            'pratyantardasha': None
        }

    # Calculate pratyantardashas
    antar_start = datetime.fromisoformat(current_antardasha['start_date'])
    antar_end = datetime.fromisoformat(current_antardasha['end_date'])
    pratyantars = get_pratyantardasha(
        current_mahadasha['planet'],
        current_antardasha['planet'],
        antar_start,
        antar_end
    )

    # Find current pratyantardasha
    current_pratyantar = None
    for prat in pratyantars:
        start = datetime.fromisoformat(prat['start_date'])
        end = datetime.fromisoformat(prat['end_date'])
        if start <= date <= end:
            current_pratyantar = prat
            break

    return {
        'mahadasha': current_mahadasha,
        'antardasha': current_antardasha,
        'pratyantardasha': current_pratyantar
    }
