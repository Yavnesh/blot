import logging
from typing import Dict, Any, Optional
import httpx

logger = logging.getLogger(__name__)

class SocialPublishingDriver:
    """
    Multi-tenant social publishing driver.
    Uses per-organization/project access tokens to post to external platforms.
    """

    @staticmethod
    async def publish_to_linkedin(access_token: str, author_urn: str, text: str, title: Optional[str] = None) -> Dict[str, Any]:
        """
        Publishes a post using LinkedIn UGC (User Generated Content) API v2.
        """
        url = "https://api.linkedin.com/v2/ugcPosts"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "X-Restli-Protocol-Version": "2.0.0",
            "Content-Type": "application/json"
        }
        author = f"urn:li:person:{author_urn}" if not author_urn.startswith("urn:li:") else author_urn
        payload = {
            "author": author,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {
                        "text": text
                    },
                    "shareMediaCategory": "NONE"
                }
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code in (200, 201):
                return {"status": "success", "platform_post_id": resp.json().get("id")}
            else:
                logger.error(f"LinkedIn publishing failed: {resp.status_code} - {resp.text}")
                return {"status": "error", "code": resp.status_code, "detail": resp.text}

    @staticmethod
    async def publish_to_twitter(access_token: str, text: str) -> Dict[str, Any]:
        """
        Publishes a single tweet using Twitter API v2.
        """
        url = "https://api.twitter.com/2/tweets"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        payload = {"text": text[:280]}

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code in (200, 201):
                data = resp.json().get("data", {})
                return {"status": "success", "platform_post_id": data.get("id")}
            else:
                logger.error(f"Twitter publishing failed: {resp.status_code} - {resp.text}")
                return {"status": "error", "code": resp.status_code, "detail": resp.text}

    @staticmethod
    async def publish_to_meta(page_access_token: str, page_id: str, message: str) -> Dict[str, Any]:
        """
        Publishes to Facebook Page Feed via Meta Graph API v19.0.
        """
        url = f"https://graph.facebook.com/v19.0/{page_id}/feed"
        params = {
            "access_token": page_access_token,
            "message": message
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, params=params)
            if resp.status_code in (200, 201):
                return {"status": "success", "platform_post_id": resp.json().get("id")}
            else:
                logger.error(f"Meta publishing failed: {resp.status_code} - {resp.text}")
                return {"status": "error", "code": resp.status_code, "detail": resp.text}
