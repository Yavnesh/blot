from fastapi import APIRouter

from app.api.api_v1.endpoints import scrape, twitter_post, trending, post, generation, finetune, seo, analytics

api_router = APIRouter()
api_router.include_router(scrape.router, prefix="/scrapes", tags=["scrapes"])
api_router.include_router(twitter_post.router, prefix="/twitter-posts", tags=["twitter-posts"])
api_router.include_router(trending.router, prefix="/trendings", tags=["trendings"])
api_router.include_router(post.router, prefix="/posts", tags=["posts"])
api_router.include_router(generation.router, prefix="/generation", tags=["generation"])
api_router.include_router(finetune.router, prefix="/finetune", tags=["finetune"])
api_router.include_router(seo.router, prefix="/seo", tags=["seo"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
