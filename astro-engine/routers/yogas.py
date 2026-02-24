from fastapi import APIRouter, HTTPException
from typing import List

from schemas.birth_data import ChartData, Yoga
from core.yoga_rules import detect_yogas

router = APIRouter(prefix="/yogas", tags=["yogas"])


@router.post("", response_model=List[Yoga])
async def detect_chart_yogas(chart_data: ChartData):
    """
    Detect all yogas from chart data

    Args:
        chart_data: Complete birth chart data

    Returns:
        List of detected yogas with strength and descriptions
    """
    try:
        yogas = detect_yogas(chart_data)
        return yogas

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Yoga detection error: {str(e)}")


@router.post("/filter/{yoga_type}", response_model=List[Yoga])
async def filter_yogas_by_type(chart_data: ChartData, yoga_type: str):
    """
    Detect yogas and filter by type

    Args:
        chart_data: Complete birth chart data
        yoga_type: Type of yoga (raj, dhana, pancha_mahapurusha, arishta, etc.)

    Returns:
        List of yogas matching the specified type
    """
    try:
        all_yogas = detect_yogas(chart_data)
        filtered = [y for y in all_yogas if y.type == yoga_type]
        return filtered

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Yoga filtering error: {str(e)}")


@router.post("/benefic", response_model=List[Yoga])
async def get_benefic_yogas(chart_data: ChartData):
    """
    Get only benefic yogas

    Args:
        chart_data: Complete birth chart data

    Returns:
        List of benefic yogas
    """
    try:
        all_yogas = detect_yogas(chart_data)
        benefic = [y for y in all_yogas if y.benefic]
        return benefic

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Benefic yoga filtering error: {str(e)}")


@router.post("/malefic", response_model=List[Yoga])
async def get_malefic_yogas(chart_data: ChartData):
    """
    Get only malefic yogas

    Args:
        chart_data: Complete birth chart data

    Returns:
        List of malefic yogas
    """
    try:
        all_yogas = detect_yogas(chart_data)
        malefic = [y for y in all_yogas if not y.benefic]
        return malefic

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Malefic yoga filtering error: {str(e)}")


@router.post("/strong", response_model=List[Yoga])
async def get_strong_yogas(chart_data: ChartData):
    """
    Get strong and exceptional yogas only

    Args:
        chart_data: Complete birth chart data

    Returns:
        List of strong/exceptional yogas
    """
    try:
        all_yogas = detect_yogas(chart_data)
        strong = [y for y in all_yogas if y.strength in ['strong', 'exceptional']]
        return strong

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Strong yoga filtering error: {str(e)}")
