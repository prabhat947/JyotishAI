"""
Test calculations against known ClickAstro output for Prabhat's birth chart

Birth Details:
- Name: Prabhat Tiwari
- DOB: 18 Feb 1994
- Time: 23:07 IST
- Place: Raipur, Chhattisgarh
- Coordinates: 21.14°N, 81.38°E

Expected Results (from ClickAstro):
- Lagna (Ascendant): Libra
- Moon: Taurus, Krittika Nakshatra, Pada 3
- Sun: Aquarius
- Ayanamsha: Lahiri (approx 23°46'46" for 1994)
"""

import pytest
from datetime import datetime, date, time
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core import calculator
from core.nakshatra import get_nakshatra
from schemas.birth_data import BirthData


# Test data
PRABHAT_BIRTH_DATA = BirthData(
    name="Prabhat Tiwari",
    birth_date=date(1994, 2, 18),
    birth_time=time(23, 7, 0),
    latitude=21.14,
    longitude=81.38,
    timezone="Asia/Kolkata"
)


def test_julian_day_calculation():
    """Test Julian Day calculation"""
    birth_datetime = datetime.combine(
        PRABHAT_BIRTH_DATA.birth_date,
        PRABHAT_BIRTH_DATA.birth_time
    )

    jd = calculator.calc_julian_day(birth_datetime, utc_offset_hours=5.5)

    # Julian Day should be around 2449407 for Feb 18, 1994
    assert 2449407.0 < jd < 2449408.0, f"Julian Day {jd} is outside expected range"
    print(f"✓ Julian Day: {jd}")


def test_ayanamsha():
    """Test Lahiri Ayanamsha calculation"""
    birth_datetime = datetime.combine(
        PRABHAT_BIRTH_DATA.birth_date,
        PRABHAT_BIRTH_DATA.birth_time
    )

    jd = calculator.calc_julian_day(birth_datetime, utc_offset_hours=5.5)
    ayanamsha = calculator.get_ayanamsha(jd)

    # Lahiri ayanamsha for 1994 should be around 23°46'
    assert 23.7 < ayanamsha < 23.9, f"Ayanamsha {ayanamsha}° is outside expected range"
    print(f"✓ Ayanamsha (Lahiri): {ayanamsha:.6f}°")


def test_lagna_calculation():
    """Test Lagna (Ascendant) calculation - Expected: Libra"""
    birth_datetime = datetime.combine(
        PRABHAT_BIRTH_DATA.birth_date,
        PRABHAT_BIRTH_DATA.birth_time
    )

    jd = calculator.calc_julian_day(birth_datetime, utc_offset_hours=5.5)
    lagna_degree = calculator.calc_lagna(
        jd,
        PRABHAT_BIRTH_DATA.latitude,
        PRABHAT_BIRTH_DATA.longitude
    )

    lagna_sign = calculator.get_sign_from_longitude(lagna_degree)

    print(f"✓ Lagna: {lagna_sign} at {lagna_degree:.2f}°")
    assert lagna_sign == "Libra", f"Expected Lagna in Libra, got {lagna_sign}"


def test_moon_position():
    """Test Moon position - Expected: Taurus, Krittika Nakshatra, Pada 3"""
    birth_datetime = datetime.combine(
        PRABHAT_BIRTH_DATA.birth_date,
        PRABHAT_BIRTH_DATA.birth_time
    )

    jd = calculator.calc_julian_day(birth_datetime, utc_offset_hours=5.5)
    positions = calculator.calc_planetary_positions(jd)

    moon_data = positions['Moon']
    moon_longitude = moon_data['longitude']
    moon_sign = calculator.get_sign_from_longitude(moon_longitude)

    print(f"✓ Moon: {moon_sign} at {moon_longitude:.2f}°")
    assert moon_sign == "Taurus", f"Expected Moon in Taurus, got {moon_sign}"

    # Check nakshatra
    nakshatra_info = get_nakshatra(moon_longitude)
    print(f"✓ Moon Nakshatra: {nakshatra_info['name']}, Pada {nakshatra_info['pada']}")
    assert nakshatra_info['name'] == "Krittika", f"Expected Krittika, got {nakshatra_info['name']}"
    assert nakshatra_info['pada'] == 3, f"Expected Pada 3, got {nakshatra_info['pada']}"


def test_sun_position():
    """Test Sun position - Expected: Aquarius"""
    birth_datetime = datetime.combine(
        PRABHAT_BIRTH_DATA.birth_date,
        PRABHAT_BIRTH_DATA.birth_time
    )

    jd = calculator.calc_julian_day(birth_datetime, utc_offset_hours=5.5)
    positions = calculator.calc_planetary_positions(jd)

    sun_data = positions['Sun']
    sun_longitude = sun_data['longitude']
    sun_sign = calculator.get_sign_from_longitude(sun_longitude)

    print(f"✓ Sun: {sun_sign} at {sun_longitude:.2f}°")
    assert sun_sign == "Aquarius", f"Expected Sun in Aquarius, got {sun_sign}"


def test_all_planets():
    """Test all planetary positions"""
    birth_datetime = datetime.combine(
        PRABHAT_BIRTH_DATA.birth_date,
        PRABHAT_BIRTH_DATA.birth_time
    )

    jd = calculator.calc_julian_day(birth_datetime, utc_offset_hours=5.5)
    positions = calculator.calc_planetary_positions(jd)

    print("\n=== All Planetary Positions ===")
    for planet_name, planet_data in positions.items():
        longitude = planet_data['longitude']
        sign = calculator.get_sign_from_longitude(longitude)
        degree_in_sign = calculator.get_degree_in_sign(longitude)
        retrograde = planet_data['is_retrograde']
        retro_symbol = "℞" if retrograde else ""

        nakshatra_info = get_nakshatra(longitude)

        print(f"{planet_name:10} {sign:12} {degree_in_sign:6.2f}° {retro_symbol:2} "
              f"| {nakshatra_info['name']:18} Pada {nakshatra_info['pada']}")


def test_house_system():
    """Test Whole Sign house system"""
    birth_datetime = datetime.combine(
        PRABHAT_BIRTH_DATA.birth_date,
        PRABHAT_BIRTH_DATA.birth_time
    )

    jd = calculator.calc_julian_day(birth_datetime, utc_offset_hours=5.5)
    lagna_degree = calculator.calc_lagna(
        jd,
        PRABHAT_BIRTH_DATA.latitude,
        PRABHAT_BIRTH_DATA.longitude
    )

    houses = calculator.calc_houses(lagna_degree)

    print("\n=== House System (Whole Sign) ===")
    for house in houses:
        print(f"House {house['number']:2}: {house['sign']:12} (Lord: {house['lord']})")

    # First house should be Libra
    assert houses[0]['sign'] == "Libra", f"Expected House 1 to be Libra, got {houses[0]['sign']}"


def test_dignity():
    """Test planetary dignity calculations"""
    birth_datetime = datetime.combine(
        PRABHAT_BIRTH_DATA.birth_date,
        PRABHAT_BIRTH_DATA.birth_time
    )

    jd = calculator.calc_julian_day(birth_datetime, utc_offset_hours=5.5)
    positions = calculator.calc_planetary_positions(jd)

    print("\n=== Planetary Dignities ===")
    for planet_name, planet_data in positions.items():
        longitude = planet_data['longitude']
        dignity = calculator.get_planet_dignity(planet_name, longitude)
        sign = calculator.get_sign_from_longitude(longitude)

        print(f"{planet_name:10} in {sign:12} -> {dignity}")


if __name__ == "__main__":
    print("=" * 70)
    print("PRABHAT'S BIRTH CHART VERIFICATION")
    print("=" * 70)
    print(f"DOB: {PRABHAT_BIRTH_DATA.birth_date}")
    print(f"Time: {PRABHAT_BIRTH_DATA.birth_time} IST")
    print(f"Place: Raipur ({PRABHAT_BIRTH_DATA.latitude}°N, {PRABHAT_BIRTH_DATA.longitude}°E)")
    print("=" * 70)

    try:
        test_julian_day_calculation()
        test_ayanamsha()
        test_lagna_calculation()
        test_moon_position()
        test_sun_position()
        test_all_planets()
        test_house_system()
        test_dignity()

        print("\n" + "=" * 70)
        print("✓ ALL TESTS PASSED!")
        print("=" * 70)

    except AssertionError as e:
        print(f"\n✗ TEST FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
