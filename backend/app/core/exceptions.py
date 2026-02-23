
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from app.core.logging import logger

async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc} - URL: {request.url}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )

async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(f"HTTP exception: {exc.detail} - URL: {request.url}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )
