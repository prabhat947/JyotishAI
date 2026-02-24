from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date, time


class BirthData(BaseModel):
    """Birth information for chart calculation"""
    name: Optional[str] = "Unknown"
    birth_date: date
    birth_time: time
    latitude: float
    longitude: float
    timezone: str = "Asia/Kolkata"
    ayanamsha: str = "lahiri"  # lahiri, raman, krishnamurti


class Planet(BaseModel):
    """Individual planet data"""
    name: str
    longitude: float
    latitude: float = 0.0
    speed: float = 0.0
    sign: str
    sign_lord: str
    degree_in_sign: float
    house: int
    nakshatra: str
    nakshatra_lord: str
    pada: int
    is_retrograde: bool = False
    dignity: str  # exalted, debilitated, own_sign, friend, enemy, neutral


class House(BaseModel):
    """House data"""
    number: int
    sign: str
    lord: str
    cusp: float  # Starting degree of the house
    planets: List[str] = []  # Planet names in this house


class Nakshatra(BaseModel):
    """Nakshatra information"""
    name: str
    number: int  # 1-27
    lord: str
    pada: int  # 1-4
    degree_range_start: float
    degree_range_end: float


class DashaPeriod(BaseModel):
    """Single dasha period"""
    planet: str
    start_date: datetime
    end_date: datetime
    level: str  # mahadasha, antardasha, pratyantardasha
    parent_planet: Optional[str] = None  # For antardasha/pratyantardasha


class DashaSequence(BaseModel):
    """Complete dasha sequence"""
    birth_date: datetime
    balance_at_birth: Dict[str, Any]  # {nakshatra_lord: str, balance_years: float, nakshatra_name: str}
    periods: List[DashaPeriod]


class Yoga(BaseModel):
    """Detected yoga"""
    name: str
    type: str  # raj, dhana, arishta, pancha_mahapurusha, etc.
    description: str
    strength: str  # weak, moderate, strong, exceptional
    planets_involved: List[str]
    houses_involved: List[int]
    classical_source: str  # BPHS, Phaladeepika, etc.
    benefic: bool  # True for benefic yogas, False for malefic


class Ashtakavarga(BaseModel):
    """Ashtakavarga scores"""
    planet: str
    house_scores: List[int]  # 12 values, one per house
    total: int


class ChartData(BaseModel):
    """Complete birth chart data"""
    birth_info: BirthData
    calculated_at: datetime = Field(default_factory=datetime.utcnow)
    julian_day: float
    ayanamsha: float
    lagna: Planet
    planets: List[Planet]
    houses: List[House]
    dasha_at_birth: DashaSequence
    yogas: List[Yoga] = []
    ashtakavarga: List[Ashtakavarga] = []


class TransitData(BaseModel):
    """Current planetary transits"""
    calculated_at: datetime
    julian_day: float
    planets: List[Planet]


class TransitAspect(BaseModel):
    """Aspect between transiting planet and natal planet"""
    transit_planet: str
    natal_planet: str
    aspect_type: str  # conjunction, opposition, trine, square, sextile
    orb: float  # Degrees of separation
    is_exact: bool  # Within 1 degree


class TransitVsNatalData(BaseModel):
    """Transit positions compared to natal chart"""
    natal_chart: ChartData
    current_transits: TransitData
    aspects: List[TransitAspect]
    significant_transits: List[str]  # Human-readable descriptions
