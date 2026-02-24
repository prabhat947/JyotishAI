from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from routers import chart, dasha, yogas, pdf

# Create FastAPI app
app = FastAPI(
    title="JyotishAI Astro Engine",
    description="Vedic Astrology Calculation Engine using Swiss Ephemeris",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific origins
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
    return {
        "name": "JyotishAI Astro Engine",
        "version": "1.0.0",
        "description": "Vedic Astrology Calculation API",
        "endpoints": {
            "chart": "/chart",
            "dasha": "/dasha",
            "yogas": "/yogas",
            "pdf": "/pdf",
            "docs": "/docs"
        }
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
