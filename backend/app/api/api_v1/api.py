from fastapi import APIRouter

from app.api.api_v1.endpoints import scrape, twitter_post, trending, post, generation, finetune, seo, analytics, auth, cms, context, token, users, organizations, billing, taxonomy

api_router = APIRouter()
api_router.include_router(scrape.router, prefix="/scrapes", tags=["scrapes"])
api_router.include_router(twitter_post.router, prefix="/twitter-posts", tags=["twitter-posts"])
api_router.include_router(trending.router, prefix="/trendings", tags=["trendings"])
api_router.include_router(post.router, prefix="/posts", tags=["posts"])
api_router.include_router(generation.router, prefix="/generation", tags=["generation"])
api_router.include_router(finetune.router, prefix="/finetune", tags=["finetune"])
api_router.include_router(seo.router, prefix="/seo", tags=["seo"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(cms.router, prefix="/cms", tags=["cms"])
api_router.include_router(context.router, prefix="/context", tags=["knowledge-base"])
api_router.include_router(token.router, prefix="/token", tags=["token"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(billing.router, prefix="/billing", tags=["billing"])
api_router.include_router(taxonomy.router, prefix="/taxonomy", tags=["taxonomy"])
