from typing import List, Optional
from pydantic import BaseModel, Field

class LinkedInPostSchema(BaseModel):
    hook: str = Field(description="First 1-2 lines designed to stop the scroll and earn the 'see more' click")
    body: str = Field(description="The core narrative broken into 1-2 sentence paragraphs with whitespace")
    key_takeaways: List[str] = Field(description="Bullet points of high-value insights or tactical learnings")
    call_to_action: str = Field(description="Discussion-provoking closing question to drive comments")
    hashtags: List[str] = Field(description="3-5 niche, high-intent professional hashtags")

class TweetCard(BaseModel):
    tweet_number: int
    content: str = Field(description="Single tweet content strictly under 280 characters")

class TwitterThreadSchema(BaseModel):
    hook_tweet: str = Field(description="Viral hook tweet under 280 characters designed to drive thread reads")
    body_tweets: List[TweetCard] = Field(description="4-8 sequential value-packed tweets")
    closing_tweet: str = Field(description="Summary tweet with CTA, link placeholder, or question")

class MetaAdSchema(BaseModel):
    primary_text: str = Field(description="Primary advertising copy highlighting pain point and solution")
    headline: str = Field(description="Short, punchy headline (< 40 characters) for the ad creative")
    description: str = Field(description="Optional link description providing social proof or guarantee")
    call_to_action_button: str = Field(description="e.g., 'Learn More', 'Sign Up', 'Get Offer'")
    visual_creative_prompt: str = Field(description="Detailed image prompt for the ad asset visual")

class BlogSeoSchema(BaseModel):
    meta_title: str = Field(description="SEO meta title under 60 characters with primary keyword")
    meta_description: str = Field(description="Compelling meta description between 140-160 characters")
    slug: str = Field(description="Clean, hyphenated URL slug")
    target_keywords: List[str] = Field(description="Primary and secondary semantic keywords targeted")
    schema_json_ld: str = Field(description="Valid Article or BlogPosting JSON-LD script string")
    content_markdown: str = Field(description="Complete blog post with structured H1, H2, and H3 headers")
