from typing import Dict, Tuple

# 27 Nakshatras with their lords (for Vimshottari dasha)
NAKSHATRA_DATA = [
    {'number': 1, 'name': 'Ashwini', 'lord': 'Ketu', 'start': 0.0, 'end': 13.333333},
    {'number': 2, 'name': 'Bharani', 'lord': 'Venus', 'start': 13.333333, 'end': 26.666667},
    {'number': 3, 'name': 'Krittika', 'lord': 'Sun', 'start': 26.666667, 'end': 40.0},
    {'number': 4, 'name': 'Rohini', 'lord': 'Moon', 'start': 40.0, 'end': 53.333333},
    {'number': 5, 'name': 'Mrigashira', 'lord': 'Mars', 'start': 53.333333, 'end': 66.666667},
    {'number': 6, 'name': 'Ardra', 'lord': 'Rahu', 'start': 66.666667, 'end': 80.0},
    {'number': 7, 'name': 'Punarvasu', 'lord': 'Jupiter', 'start': 80.0, 'end': 93.333333},
    {'number': 8, 'name': 'Pushya', 'lord': 'Saturn', 'start': 93.333333, 'end': 106.666667},
    {'number': 9, 'name': 'Ashlesha', 'lord': 'Mercury', 'start': 106.666667, 'end': 120.0},
    {'number': 10, 'name': 'Magha', 'lord': 'Ketu', 'start': 120.0, 'end': 133.333333},
    {'number': 11, 'name': 'Purva Phalguni', 'lord': 'Venus', 'start': 133.333333, 'end': 146.666667},
    {'number': 12, 'name': 'Uttara Phalguni', 'lord': 'Sun', 'start': 146.666667, 'end': 160.0},
    {'number': 13, 'name': 'Hasta', 'lord': 'Moon', 'start': 160.0, 'end': 173.333333},
    {'number': 14, 'name': 'Chitra', 'lord': 'Mars', 'start': 173.333333, 'end': 186.666667},
    {'number': 15, 'name': 'Swati', 'lord': 'Rahu', 'start': 186.666667, 'end': 200.0},
    {'number': 16, 'name': 'Vishakha', 'lord': 'Jupiter', 'start': 200.0, 'end': 213.333333},
    {'number': 17, 'name': 'Anuradha', 'lord': 'Saturn', 'start': 213.333333, 'end': 226.666667},
    {'number': 18, 'name': 'Jyeshtha', 'lord': 'Mercury', 'start': 226.666667, 'end': 240.0},
    {'number': 19, 'name': 'Mula', 'lord': 'Ketu', 'start': 240.0, 'end': 253.333333},
    {'number': 20, 'name': 'Purva Ashadha', 'lord': 'Venus', 'start': 253.333333, 'end': 266.666667},
    {'number': 21, 'name': 'Uttara Ashadha', 'lord': 'Sun', 'start': 266.666667, 'end': 280.0},
    {'number': 22, 'name': 'Shravana', 'lord': 'Moon', 'start': 280.0, 'end': 293.333333},
    {'number': 23, 'name': 'Dhanishta', 'lord': 'Mars', 'start': 293.333333, 'end': 306.666667},
    {'number': 24, 'name': 'Shatabhisha', 'lord': 'Rahu', 'start': 306.666667, 'end': 320.0},
    {'number': 25, 'name': 'Purva Bhadrapada', 'lord': 'Jupiter', 'start': 320.0, 'end': 333.333333},
    {'number': 26, 'name': 'Uttara Bhadrapada', 'lord': 'Saturn', 'start': 333.333333, 'end': 346.666667},
    {'number': 27, 'name': 'Revati', 'lord': 'Mercury', 'start': 346.666667, 'end': 360.0}
]

# Vimshottari dasha order (repeating cycle)
DASHA_ORDER = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury']

# Dasha years for each planet
DASHA_YEARS = {
    'Sun': 6,
    'Moon': 10,
    'Mars': 7,
    'Rahu': 18,
    'Jupiter': 16,
    'Saturn': 19,
    'Mercury': 17,
    'Ketu': 7,
    'Venus': 20
}


def get_nakshatra(longitude: float) -> Dict:
    """
    Get nakshatra details from longitude

    Args:
        longitude: Sidereal longitude (0-360°)

    Returns:
        Dict with name, number, lord, pada
    """
    for nak in NAKSHATRA_DATA:
        if nak['start'] <= longitude < nak['end']:
            # Calculate pada (1-4)
            nakshatra_span = nak['end'] - nak['start']  # 13.333333°
            pada_span = nakshatra_span / 4  # 3.333333° per pada
            position_in_nakshatra = longitude - nak['start']
            pada = int(position_in_nakshatra / pada_span) + 1

            return {
                'name': nak['name'],
                'number': nak['number'],
                'lord': nak['lord'],
                'pada': pada,
                'degree_range_start': nak['start'],
                'degree_range_end': nak['end']
            }

    # Edge case: exactly 360° should be Revati
    return {
        'name': 'Revati',
        'number': 27,
        'lord': 'Mercury',
        'pada': 4,
        'degree_range_start': 346.666667,
        'degree_range_end': 360.0
    }


def get_nakshatra_lord_index(nakshatra_lord: str) -> int:
    """Get the index of nakshatra lord in dasha order"""
    return DASHA_ORDER.index(nakshatra_lord)


def get_next_dasha_lord(current_lord: str) -> str:
    """Get next dasha lord in sequence"""
    current_index = DASHA_ORDER.index(current_lord)
    next_index = (current_index + 1) % len(DASHA_ORDER)
    return DASHA_ORDER[next_index]
