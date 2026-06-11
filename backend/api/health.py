from fastapi import APIRouter
from typing import Dict, Any

from backend.utils.logger import get_logger


logger = get_logger("nexora")
health_router = APIRouter()


@health_router.get("/")
async def health_check() -> Dict[str, str]:
    logger.debug("Health check endpoint called")
    return {"status": "healthy"}


@health_router.get("/ready")
async def readiness_check() -> Dict[str, Any]:
    logger.debug("Readiness check endpoint called")
    return {
        "status": "ready",
        "checks": {
            "database": "unknown",
            "vector_store": "unknown",
            "llm_provider": "unknown"
        }
    }


@health_router.get("/live")
async def liveness_check() -> Dict[str, str]:
    logger.debug("Liveness check endpoint called")
    return {"status": "alive"}
