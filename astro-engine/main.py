from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

from routers import chart, dasha, yogas, pdf

# Environment configuration
is_production = os.getenv("ENVIRONMENT", "development") == "production"
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")

# Create FastAPI app
app = FastAPI(
    title="JyotishAI Astro Engine",
    description="Vedic Astrology Calculation Engine using Swiss Ephemeris",
    version="1.0.0",
    docs_url=None if is_production else "/docs",
    redoc_url=None if is_production else "/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chart.router)
app.include_router(dasha.router)
app.include_router(yogas.router)
app.include_router(pdf.router)


@app.get("/")
async def root():
    """Root endpoint - API info"""
    endpoints = {
        "chart": "/chart",
        "dasha": "/dasha",
        "yogas": "/yogas",
        "pdf": "/pdf",
    }
    if not is_production:
        endpoints["docs"] = "/docs"

    return {
        "name": "JyotishAI Astro Engine",
        "version": "1.0.0",
        "description": "Vedic Astrology Calculation API",
        "endpoints": endpoints
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "astro-engine"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
