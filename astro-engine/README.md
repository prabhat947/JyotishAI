# JyotishAI Astro Engine

FastAPI microservice for Vedic astrology calculations using Swiss Ephemeris (pyswisseph).

## Features

- **Birth Chart Calculation**: Complete Vedic birth chart with planets, houses, nakshatras
- **Vimshottari Dasha**: 120-year dasha sequence with mahadasha, antardasha, pratyantardasha
- **Yoga Detection**: 30+ classical yogas (Gaja Kesari, Raj Yoga, Pancha Mahapurusha, etc.)
- **Ashtakavarga**: Benefic point calculations for all planets
- **Transit Calculations**: Current planetary positions and aspects to natal chart
- **PDF Reports**: Generate styled PDF reports with ReportLab

## Tech Stack

- **Framework**: FastAPI
- **Calculations**: pyswisseph (Swiss Ephemeris)
- **Ayanamsha**: Lahiri (Chitrapaksha)
- **House System**: Whole Sign (Vedic standard)
- **Dasha System**: Vimshottari
- **PDF Generation**: ReportLab

## Installation

### Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

Server will start at `http://localhost:8000`

### Docker

```bash
# Build image
docker build -t jyotish-astro-engine .

# Run container
docker run -p 8000:8000 jyotish-astro-engine
```

## API Endpoints

### Chart Calculation
- `POST /chart` - Calculate complete birth chart
- `GET /chart/transits` - Get current planetary transits
- `POST /chart/transits/natal` - Compare transits to natal chart

### Dasha
- `POST /dasha` - Calculate Vimshottari dasha sequence
- `POST /dasha/current` - Get current mahadasha/antardasha
- `GET /dasha/antardasha/{planet}` - Get antardasha periods
- `GET /dasha/pratyantardasha/{maha}/{antar}` - Get pratyantardasha periods

### Yogas
- `POST /yogas` - Detect all yogas
- `POST /yogas/filter/{type}` - Filter yogas by type
- `POST /yogas/benefic` - Get benefic yogas only
- `POST /yogas/malefic` - Get malefic yogas only
- `POST /yogas/strong` - Get strong yogas only

### PDF Generation
- `POST /pdf/report` - Generate PDF report (download)
- `POST /pdf/report/preview` - Generate PDF report (preview)

## API Documentation

Interactive API docs available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Testing

Run tests with pytest:

```bash
# Install test dependencies
pip install pytest

# Run tests
pytest tests/test_calculator.py -v

# Or run directly
python tests/test_calculator.py
```

Test verifies calculations against ClickAstro output for:
- DOB: 18 Feb 1994, 23:07 IST
- Place: Raipur (21.14°N, 81.38°E)
- Expected: Lagna=Libra, Moon=Taurus/Krittika Pada 3, Sun=Aquarius

## Calculation Accuracy

- **Planetary positions**: ±1 arcminute (Swiss Ephemeris standard)
- **Ayanamsha**: Lahiri (Chitrapaksha) - matches ClickAstro/AstroVision
- **Dasha**: Vimshottari with exact balance calculation
- **Yogas**: 30+ classical yogas from BPHS and other classical texts

## Architecture

```
astro-engine/
├── main.py                 # FastAPI app
├── routers/
│   ├── chart.py           # Chart calculation endpoints
│   ├── dasha.py           # Dasha calculation endpoints
│   ├── yogas.py           # Yoga detection endpoints
│   └── pdf.py             # PDF generation endpoints
├── core/
│   ├── calculator.py      # Swiss Ephemeris wrapper
│   ├── nakshatra.py       # 27 nakshatras + pada
│   ├── dasha.py           # Vimshottari dasha engine
│   ├── yoga_rules.py      # 30+ yoga detection rules
│   └── ashtakavarga.py    # Ashtakavarga calculations
├── schemas/
│   └── birth_data.py      # Pydantic models
└── tests/
    └── test_calculator.py # Tests against known output
```

## Environment

No environment variables required. All calculations are local using pyswisseph.

Optional: Place Swiss Ephemeris data files in `ephe/` directory for extended date ranges.

## License

Private - Personal/Family Use + Portfolio

## Authors

Prabhat Tiwari (JyotishAI)
