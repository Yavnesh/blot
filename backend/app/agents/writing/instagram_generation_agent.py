from typing import Dict, Any, List, Optional
import json
import re
from loguru import logger
from pydantic import BaseModel
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client

class Slide(BaseModel):
    slide_number: int
    headline: str
    body: str  # Short bold text related to the background image
    image_prompt: str
    image_url: Optional[str] = None

class TaxonomyOutput(BaseModel):
    category: str
    primary_subcategory: str
    secondary_subcategories: List[str]

class InstagramOutputSchema(BaseModel):
    caption: str
    hashtags: List[str]
    slides: List[Slide]
    target_audience_classification: TaxonomyOutput
    editorial_tone_classification: TaxonomyOutput

class InstagramGenerationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Instagram Content Generator",
            rules=[
                "Write slide copy that is extremely concise (max 15 words for body overlay) and high-impact.",
                "Structure slides logically, ensuring a satisfying narrative flow from hook to resolution.",
                "Craft captions that sound authentic, human-centric, and avoid sterile AI corporate speak.",
                "Integrate the recommended hashtags organically.",
                "Formulate descriptive image prompts reflecting the visual style strategy for Stable Diffusion."
            ]
        )

    async def _execute(self, input_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> AgentOutput:
        verified_research = input_data.get("verified_research", [])
        topic = str(input_data.get("topic", ""))
        tone = str(input_data.get("tone", "educational"))
        audience = str(input_data.get("audience", "developers"))
        instagram_format = str(input_data.get("instagram_format", "carousel"))
        strategy = input_data.get("strategy", {})
        target_audience_taxonomy = input_data.get("target_audience_taxonomy")
        editorial_tone_taxonomy = input_data.get("editorial_tone_taxonomy")

        logger.info(f"InstagramGenerationAgent: Starting content generation for '{topic}' (Audience Tax: {target_audience_taxonomy}, Tone Tax: {editorial_tone_taxonomy})")

        # Compile research insights
        research_context = "\n\n".join([
            f"Source: {r.get('title', 'N/A')}\nContent: {str(r.get('text', r.get('snippet', '')))[:1500]}"
            for r in verified_research[:5]
        ])

        taxonomy_info = ""
        if target_audience_taxonomy:
            taxonomy_info += f"\nTarget Audience Taxonomy: {json.dumps(target_audience_taxonomy)}"
        if editorial_tone_taxonomy:
            taxonomy_info += f"\nEditorial Tone Taxonomy: {json.dumps(editorial_tone_taxonomy)}"

        prompt = f"""
        You are an elite Instagram growth creator and social media strategist. Generate the final Instagram post content based on the following strategy and verified research.

        Topic: {topic}
        Audience: {audience}
        Tone: {tone}
        Format: {instagram_format}
        {taxonomy_info}
        
        Strategy Parameters:
        - Angle: {strategy.get('angle', 'N/A')}
        - Hook Idea: {strategy.get('hook', 'N/A')}
        - Story Structure: {strategy.get('story_structure', 'N/A')}
        - CTA Goal: {strategy.get('cta', 'N/A')}
        - Visual Style Guideline: {strategy.get('visual_style', 'N/A')}

        Verified Research Content:
        {research_context}

        Requirements:
        1. SLIDES: 
           - For 'carousel', you MUST generate AT LEAST 3 slides (typically 3 to 7 slides).
           - Slide 1 must feature the hook. The final slide must feature the CTA.
           - Each slide's `headline` must be a high-impact title.
           - Each slide's `body` MUST be a short, separate bold overlay text (max 10-15 words) that is directly related to the visual setting of the background image described in `image_prompt`.
           - The `image_prompt` for each slide must incorporate the Visual Style Guideline: "{strategy.get('visual_style', 'N/A')}" and express the context of the slide properly. Do not include text on the image prompt, describe only the visual setting.
        2. CAPTION (Post Description):
           - In the caption, you MUST put the detailed main content/core value paragraphs of all the slides.
           - For each slide, write a detailed, highly informative summary paragraph in the description, so that users can read the detailed "main content" in the caption of the post.
           - End the caption with the hashtags.
           - Start with an attention-grabbing line (no emojis in the first line).
           - Use line breaks to create white space.
           - Avoid cliché AI words like 'revolutionize', 'delve', 'testament', 'furthermore'.
        3. HASHTAGS:
           - Provide 10-15 highly relevant, active hashtags in an array.
        4. TAXONOMY CLASSIFICATION:
           - You MUST classify this post into the Target Audience and Editorial Tone 3-level taxonomy hierarchy.
           - For Target Audience, category is 'Target Audience'. Choose exactly one Primary subcategory and one or more Secondary subcategories ONLY from the selected primary branch:
             * Professional / Industry-Based -> [Developers / Technical, Entrepreneurs / Founders, Marketers, Designers / Creatives, Sales Professionals, HR / Recruiters, Finance Professionals, Legal Professionals, Consultants, Educators / Teachers, Students, Researchers / Academics, Healthcare Professionals, Real Estate Professionals, Government Officials, Military / Defense, Nonprofit / NGO Workers, Customer Support Professionals, Product Managers, Operations Professionals, Media / Journalists, Influencers / Creators, Freelancers, Small Business Owners, Corporate / Enterprise Employees, C-Suite / Executives]
             * Interest-Based -> [Technology, Artificial Intelligence, Startups, Business, Investing, Politics, Government / Public Policy, Sports, Fitness, Gaming, Anime / Manga, Movies / TV, Music, Fashion, Beauty, Luxury Lifestyle, Foodies, Travel, Photography, Automotive, Science, Space, History, Books / Reading, Parenting, Pets / Animal Lovers, Spirituality, Sustainability / Climate, DIY / Makers, Memes / Entertainment]
             * Consumer Intent -> [Buyers / Consumers, Decision Makers, Researchers, Early Adopters, Hobbyists, Professionals, Enterprise Buyers, Recruiters, Job Seekers, Investors, Fans / Community Members]
             * Demographic-Based -> [Gen Z, Millennials, Gen X, Boomers, Teens, College Students, Young Professionals, Parents, Retirees]
             * Organization Type -> [Startups, SMBs, Enterprises, Government Organizations, Educational Institutions, Nonprofits, Agencies, Media Companies]
             * Online Behavior -> [Content Creators, Influencers, Power Users, Casual Users, Trend Followers, Educators, Community Builders, Newsletter Readers, Podcast Listeners]
             * Tech Sophistication -> [Technical, Non-Technical, Beginner, Intermediate, Advanced / Expert]
             * Geography / Culture -> [Local Audience, National Audience, Global Audience, Urban, Rural, Regional Language Communities]
           - For Editorial Tone, category is 'Editorial Tone'. Choose exactly one Primary subcategory and one or more Secondary subcategories ONLY from the selected primary branch:
             * Educational / Informative -> [Educational / Value-Driven, Tutorial / How-To, Explainer, Insightful, Thought Leadership, Analytical / Data-Driven, Research-Based, Industry Commentary, Strategic, Step-by-Step, Case Study, Myth-Busting, FAQ Style, Opinion + Analysis]
             * Conversational / Casual -> [Casual / Chatty, Friendly, Relatable, Authentic, Personal, Behind-the-Scenes, Diary / Journal Style, Community-Oriented, Playful, Warm, Humanized, Interactive, Conversational Q&A]
             * Emotional / Inspirational -> [Inspirational, Motivational, Empowering, Aspirational, Visionary, Encouraging, Hopeful, Emotional Storytelling, Reflective, Heartfelt, Purpose-Driven]
             * Bold / Attention-Grabbing -> [Bold / Provocative, Contrarian, Hot Take, Polarizing, Controversial, Aggressive, FOMO, Urgent, Direct / No-Fluff, Confident, Disruptive, Challenging, Debate-Oriented]
             * Professional / Corporate -> [Professional, Executive / C-Suite, Formal, Corporate, Investor-Friendly, Press / Announcement Style, Authoritative, Trust-Building, Institutional, Policy-Oriented]
             * Creative / Entertainment -> [Humorous, Satirical, Meme-Based, Entertaining, Dramatic, Cinematic, Trendy, Pop-Culture Driven, Experimental, Artistic, Story-First, Edgy, Witty / Clever]
             * Sales / Marketing-Oriented -> [Promotional, Persuasive, Product-Focused, Benefit-Driven, Launch / Hype, Scarcity-Driven, Conversion-Focused, Testimonial Style, Social Proof, Community Hype, CTA-Heavy, Brand-Building]
             * Minimal / Aesthetic -> [Minimalist, Clean / Premium, Luxury, Elegant, Sophisticated, Calm, Zen / Mindful, Soft / Subtle, High-End Editorial]
             * Activism / Social Impact -> [Political, Activist, Advocacy-Oriented, Awareness-Focused, Community Mobilization, Justice-Oriented, Reformist, Ethical / Moral]
             * Viral Social Media Styles -> [Trend-Jacking, Hook-Heavy, Short-Form Viral, Rage-Bait, Curiosity-Driven, Reaction Style, Screenshot / Text Style, Twitter-Like Commentary, Influencer Style, POV Style]
        """

        personalization = input_data.get("personalization", {})
        if personalization.get("enabled", True):
            cp = personalization.get("company_profile", {})
            personalization_context = f"""
            Representing Company: {cp.get('company_name')}
            Brand Voice: {cp.get('brand_voice')}
            Brand Tone: {cp.get('brand_tone')}
            USP: {cp.get('usp')}
            Core Offerings: {cp.get('products_services')}

            Ensure the tone and messaging align with {cp.get('company_name')}'s identity.
            """
            prompt += personalization_context

        try:
            response = await genai_client.generate_structured(prompt, output_schema=InstagramOutputSchema)
            content = genai_client.extract_pre_post_content(response)
            generated_data = json.loads(content)
            
            # Auto-populate background image URLs using Picsum seeds based on slide content keywords
            slides = generated_data.get("slides", [])
            for slide in slides:
                headline = slide.get("headline", "")
                words = [re.sub(r'[^a-zA-Z0-9]', '', w.lower()) for w in headline.split()]
                words = [w for w in words if w and w not in ['a', 'an', 'the', 'is', 'are', 'in', 'on', 'at', 'to', 'for', 'with', 'and', 'vs', 'or', 'of']]
                seed_kw = "-".join(words[:3]) if words else str(slide.get("slide_number", 1))
                slide["image_url"] = f"https://picsum.photos/seed/{seed_kw}/800/800"
        except Exception as e:
            logger.error(f"InstagramGenerationAgent: Failed to generate content: {e}")
            return AgentOutput(data={}, status="error", feedback=str(e))

        logger.info("InstagramGenerationAgent: Content generated successfully.")

        return AgentOutput(
            data=generated_data,
            prompt=prompt,
            status="success"
        )

