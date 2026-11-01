import logging
from asgiref.sync import async_to_sync
from app.core.celery_app import celery_app
from app.db.session import get_db_session
from app.models.post import Post
from app.models.social_account import SocialAccount
from app.models.enums import ReviewStatus
from app.services.social_publishers import SocialPublishingDriver

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, name="blot.publishing.publish_post", max_retries=3, queue="heavy")
def publish_post_task(self, post_id: int, social_account_id: int):
    """
    Celery background worker task for publishing manager-approved posts to linked social accounts.
    """
    logger.info(f"Publishing post {post_id} to social account {social_account_id}")

    with get_db_session() as db:
        post = db.query(Post).filter(Post.id == post_id).first()
        account = db.query(SocialAccount).filter(SocialAccount.id == social_account_id).first()

        if not post or not account:
            logger.error(f"Post {post_id} or SocialAccount {social_account_id} not found.")
            return {"status": "error", "message": "Record not found"}

        if post.review_status != ReviewStatus.MANAGER_APPROVED.value:
            logger.error(f"Cannot publish post {post_id}: Review status is '{post.review_status}', not 'manager_approved'.")
            return {"status": "error", "message": "Post is not manager-approved."}

        # Format content
        raw_content = post.content or []
        body_text = "\n\n".join(raw_content) if isinstance(raw_content, list) else str(raw_content)
        title_str = (post.title[0] if isinstance(post.title, list) else str(post.title)) if post.title else "Post"

        post.review_status = ReviewStatus.PUBLISHING.value
        db.commit()

        result = {}
        platform = account.platform.lower()

        try:
            if platform == "linkedin":
                result = async_to_sync(SocialPublishingDriver.publish_to_linkedin)(
                    access_token=account.access_token,
                    author_urn=account.account_id,
                    text=f"{title_str}\n\n{body_text}",
                    title=title_str
                )
            elif platform == "twitter":
                result = async_to_sync(SocialPublishingDriver.publish_to_twitter)(
                    access_token=account.access_token,
                    text=body_text[:280]
                )
            elif platform in ("facebook", "meta"):
                result = async_to_sync(SocialPublishingDriver.publish_to_meta)(
                    page_access_token=account.access_token,
                    page_id=account.account_id,
                    message=f"{title_str}\n\n{body_text}"
                )
            else:
                result = {"status": "error", "message": f"Unsupported platform: {platform}"}

            if result.get("status") == "success":
                post.review_status = ReviewStatus.PUBLISHED.value
                post.pub_platform = platform
                post.pub_meta = {"platform_post_id": result.get("platform_post_id")}
                db.commit()
                logger.info(f"Post {post_id} published to {platform} successfully!")
            else:
                post.review_status = ReviewStatus.FAILED.value
                post.pub_meta = {"error": result}
                db.commit()
                logger.error(f"Failed to publish post {post_id}: {result}")

            return result

        except Exception as exc:
            post.review_status = ReviewStatus.FAILED.value
            post.pub_meta = {"exception": str(exc)}
            db.commit()
            logger.error(f"Exception during publishing: {exc}")
            raise self.retry(exc=exc, countdown=60)
