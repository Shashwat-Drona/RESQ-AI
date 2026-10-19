"""API v1 Router registry."""

from fastapi import APIRouter
from app.api.v1.endpoints import config, health, info, simulation

api_v1_router = APIRouter()

api_v1_router.include_router(health.router)
api_v1_router.include_router(info.router)
api_v1_router.include_router(config.router)
api_v1_router.include_router(simulation.router)
