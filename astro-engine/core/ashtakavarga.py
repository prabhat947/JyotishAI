from typing import Dict, List
from schemas.birth_data import ChartData, Ashtakavarga


# Ashtakavarga benefic points (simplified version)
# Each planet gives points to certain houses from itself and other planets
ASHTAKAVARGA_POINTS = {
    'Sun': {
        'from_Sun': [1, 2, 4, 7, 8, 9, 10, 11],
        'from_Moon': [3, 6, 10, 11],
        'from_Mars': [1, 2, 4, 7, 8, 9, 10, 11],
        'from_Mercury': [3, 5, 6, 9, 10, 11, 12],
        'from_Jupiter': [5, 6, 9, 11],
        'from_Venus': [6, 7, 12],
        'from_Saturn': [1, 2, 4, 7, 8, 9, 10, 11]
    },
    'Moon': {
        'from_Sun': [3, 6, 7, 8, 10, 11],
        'from_Moon': [1, 3, 6, 7, 10, 11],
        'from_Mars': [2, 3, 5, 6, 9, 10, 11],
        'from_Mercury': [1, 3, 4, 5, 7, 8, 10, 11],
        'from_Jupiter': [1, 4, 7, 8, 10, 11, 12],
        'from_Venus': [3, 4, 5, 7, 9, 10, 11],
        'from_Saturn': [3, 5, 6, 11]
    },
    'Mars': {
        'from_Sun': [1, 2, 4, 7, 8, 10, 11],
        'from_Moon': [3, 6, 11],
        'from_Mars': [1, 2, 4, 7, 8, 10, 11],
        'from_Mercury': [3, 5, 6, 11],
        'from_Jupiter': [6, 10, 11, 12],
        'from_Venus': [6, 8, 11, 12],
        'from_Saturn': [1, 4, 7, 8, 9, 10, 11]
    },
    'Mercury': {
        'from_Sun': [5, 6, 9, 11, 12],
        'from_Moon': [2, 4, 6, 8, 10, 11],
        'from_Mars': [1, 2, 4, 7, 8, 9, 10, 11],
        'from_Mercury': [1, 3, 5, 6, 9, 10, 11, 12],
        'from_Jupiter': [6, 8, 11, 12],
        'from_Venus': [1, 2, 3, 4, 5, 8, 9, 11],
        'from_Saturn': [1, 2, 4, 7, 8, 9, 10, 11]
    },
    'Jupiter': {
        'from_Sun': [1, 2, 3, 4, 7, 8, 9, 10, 11],
        'from_Moon': [2, 5, 7, 9, 11],
        'from_Mars': [1, 2, 4, 7, 8, 10, 11],
        'from_Mercury': [1, 2, 4, 5, 6, 9, 10, 11],
        'from_Jupiter': [1, 2, 3, 4, 7, 8, 10, 11],
        'from_Venus': [2, 5, 6, 9, 10, 11],
        'from_Saturn': [3, 5, 6, 12]
    },
    'Venus': {
        'from_Sun': [8, 11, 12],
        'from_Moon': [1, 2, 3, 4, 5, 8, 9, 11, 12],
        'from_Mars': [3, 4, 6, 9, 11, 12],
        'from_Mercury': [3, 5, 6, 9, 11],
        'from_Jupiter': [5, 8, 9, 10, 11],
        'from_Venus': [1, 2, 3, 4, 5, 8, 9, 11, 12],
        'from_Saturn': [3, 4, 5, 8, 9, 10, 11]
    },
    'Saturn': {
        'from_Sun': [1, 2, 4, 7, 8, 10, 11],
        'from_Moon': [3, 6, 11],
        'from_Mars': [3, 5, 6, 10, 11, 12],
        'from_Mercury': [6, 8, 9, 10, 11, 12],
        'from_Jupiter': [5, 6, 11, 12],
        'from_Venus': [6, 11, 12],
        'from_Saturn': [3, 5, 6, 11]
    }
}


def calc_ashtakavarga(chart_data: ChartData) -> List[Ashtakavarga]:
    """
    Calculate Ashtakavarga (benefic points) for each planet

    Args:
        chart_data: Complete chart data

    Returns:
        List of Ashtakavarga objects with scores for each house
    """
    planets_dict = {p.name: p for p in chart_data.planets}
    results = []

    for planet_name in ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']:
        if planet_name not in planets_dict:
            continue

        house_scores = [0] * 12  # 12 houses

        # Get benefic points from each planet
        points_config = ASHTAKAVARGA_POINTS.get(planet_name, {})

        for from_planet, benefic_houses in points_config.items():
            reference_planet_name = from_planet.replace('from_', '')

            if reference_planet_name not in planets_dict:
                continue

            # Get house of reference planet
            reference_house = planets_dict[reference_planet_name].house

            # Add points to benefic houses counted from reference planet
            for benefic_house_offset in benefic_houses:
                # Calculate which house gets the point
                target_house = ((reference_house - 1 + benefic_house_offset - 1) % 12) + 1
                house_scores[target_house - 1] += 1

        total_score = sum(house_scores)

        results.append(Ashtakavarga(
            planet=planet_name,
            house_scores=house_scores,
            total=total_score
        ))

    # Calculate Sarvashtakavarga (combined scores)
    sarva_scores = [0] * 12
    for result in results:
        for i in range(12):
            sarva_scores[i] += result.house_scores[i]

    results.append(Ashtakavarga(
        planet='Sarvashtakavarga',
        house_scores=sarva_scores,
        total=sum(sarva_scores)
    ))

    return results
