import tweepy
from app.core.config import settings

def get_twitter_client():
    if not all([settings.TWITTER_CONSUMER_KEY, settings.TWITTER_CONSUMER_SECRET, 
                settings.TWITTER_ACCESS_TOKEN, settings.TWITTER_ACCESS_TOKEN_SECRET]):
        return None
        
    return tweepy.Client(
        consumer_key=settings.TWITTER_CONSUMER_KEY,
        consumer_secret=settings.TWITTER_CONSUMER_SECRET,
        access_token=settings.TWITTER_ACCESS_TOKEN,
        access_token_secret=settings.TWITTER_ACCESS_TOKEN_SECRET
    )
