"""RESQ-AI FastAPI Application Entrypoint."""

import logging
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.endpoints.health import router as health_router
from app.api.v1.router import api_v1_router
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("resq_ai")

app = FastAPI(
    title=settings.app_name,
    description=settings.description,
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS Middleware
logger.info(f"Configuring CORS with allowed origins: {settings.cors_origins}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Custom error handler for validation errors with consistent JSON response."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": "The request payload or parameters failed validation.",
            "details": exc.errors(),
        },
    )


# Primary health endpoint: /api/health
app.include_router(health_router, prefix="/api")

# Version 1 API endpoints: /api/v1/...
app.include_router(api_v1_router, prefix="/api/v1")


@app.get("/", tags=["Root"])
async def root():
    """Root entry point providing discovery links."""
    return {
        "service": settings.app_name,
        "phase": settings.phase,
        "status": "online",
        "documentation": "/docs",
        "health": "/api/health",
        "info": "/api/v1/info",
        "config": "/api/v1/config",
        "simulation_state": "/api/v1/simulation/state",
    }
