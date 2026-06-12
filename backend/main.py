from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.api.routes import router
from backend.api.health import health_router
from backend.utils.logger import setup_logger


logger = setup_logger(
    name="nexora",
    level=settings.LOG_LEVEL,
    log_file=settings.LOG_FILE
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Nexora Backend...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Debug mode: {settings.DEBUG}")
    yield
    logger.info("Shutting down Nexora Backend...")


app = FastAPI(
    title="Nexora API",
    description="Agentic AI Coding Assistant Backend",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")
app.include_router(health_router, prefix="/health")


if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting server on {settings.HOST}:{settings.PORT}")
    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
