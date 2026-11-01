from sqlalchemy.orm import Session
from loguru import logger
from app.models.taxonomy import Category, PrimarySubcategory, SecondarySubcategory

TAXONOMY_DATA = {
    "Target Audience": {
        "Professional / Industry-Based": [
            "Developers / Technical", "Entrepreneurs / Founders", "Marketers",
            "Designers / Creatives", "Sales Professionals", "HR / Recruiters",
            "Finance Professionals", "Legal Professionals", "Consultants",
            "Educators / Teachers", "Students", "Researchers / Academics",
            "Healthcare Professionals", "Real Estate Professionals",
            "Government Officials", "Military / Defense", "Nonprofit / NGO Workers",
            "Customer Support Professionals", "Product Managers", "Operations Professionals",
            "Media / Journalists", "Influencers / Creators", "Freelancers",
            "Small Business Owners", "Corporate / Enterprise Employees",
            "C-Suite / Executives"
        ],
        "Interest-Based": [
            "Technology", "Artificial Intelligence", "Startups", "Business",
            "Investing", "Politics", "Government / Public Policy", "Sports",
            "Fitness", "Gaming", "Anime / Manga", "Movies / TV", "Music",
            "Fashion", "Beauty", "Luxury Lifestyle", "Foodies", "Travel",
            "Photography", "Automotive", "Science", "Space", "History",
            "Books / Reading", "Parenting", "Pets / Animal Lovers", "Spirituality",
            "Sustainability / Climate", "DIY / Makers", "Memes / Entertainment"
        ],
        "Consumer Intent": [
            "Buyers / Consumers", "Decision Makers", "Researchers", "Early Adopters",
            "Hobbyists", "Professionals", "Enterprise Buyers", "Recruiters",
            "Job Seekers", "Investors", "Fans / Community Members"
        ],
        "Demographic-Based": [
            "Gen Z", "Millennials", "Gen X", "Boomers", "Teens", "College Students",
            "Young Professionals", "Parents", "Retirees"
        ],
        "Organization Type": [
            "Startups", "SMBs", "Enterprises", "Government Organizations",
            "Educational Institutions", "Nonprofits", "Agencies", "Media Companies"
        ],
        "Online Behavior": [
            "Content Creators", "Influencers", "Power Users", "Casual Users",
            "Trend Followers", "Educators", "Community Builders", "Newsletter Readers",
            "Podcast Listeners"
        ],
        "Tech Sophistication": [
            "Technical", "Non-Technical", "Beginner", "Intermediate", "Advanced / Expert"
        ],
        "Geography / Culture": [
            "Local Audience", "National Audience", "Global Audience", "Urban",
            "Rural", "Regional Language Communities"
        ]
    },
    "Editorial Tone": {
        "Educational / Informative": [
            "Educational / Value-Driven", "Tutorial / How-To", "Explainer",
            "Insightful", "Thought Leadership", "Analytical / Data-Driven",
            "Research-Based", "Industry Commentary", "Strategic", "Step-by-Step",
            "Case Study", "Myth-Busting", "FAQ Style", "Opinion + Analysis"
        ],
        "Conversational / Casual": [
            "Casual / Chatty", "Friendly", "Relatable", "Authentic", "Personal",
            "Behind-the-Scenes", "Diary / Journal Style", "Community-Oriented",
            "Playful", "Warm", "Humanized", "Interactive", "Conversational Q&A"
        ],
        "Emotional / Inspirational": [
            "Inspirational", "Motivational", "Empowering", "Aspirational",
            "Visionary", "Encouraging", "Hopeful", "Emotional Storytelling",
            "Reflective", "Heartfelt", "Purpose-Driven"
        ],
        "Bold / Attention-Grabbing": [
            "Bold / Provocative", "Contrarian", "Hot Take", "Polarizing",
            "Controversial", "Aggressive", "FOMO", "Urgent", "Direct / No-Fluff",
            "Confident", "Disruptive", "Challenging", "Debate-Oriented"
        ],
        "Professional / Corporate": [
            "Professional", "Executive / C-Suite", "Formal", "Corporate",
            "Investor-Friendly", "Press / Announcement Style", "Authoritative",
            "Trust-Building", "Institutional", "Policy-Oriented"
        ],
        "Creative / Entertainment": [
            "Humorous", "Satirical", "Meme-Based", "Entertaining", "Dramatic",
            "Cinematic", "Trendy", "Pop-Culture Driven", "Experimental",
            "Artistic", "Story-First", "Edgy", "Witty / Clever"
        ],
        "Sales / Marketing-Oriented": [
            "Promotional", "Persuasive", "Product-Focused", "Benefit-Driven",
            "Launch / Hype", "Scarcity-Driven", "Conversion-Focused",
            "Testimonial Style", "Social Proof", "Community Hype", "CTA-Heavy",
            "Brand-Building"
        ],
        "Minimal / Aesthetic": [
            "Minimalist", "Clean / Premium", "Luxury", "Elegant", "Sophisticated",
            "Calm", "Zen / Mindful", "Soft / Subtle", "High-End Editorial"
        ],
        "Activism / Social Impact": [
            "Political", "Activist", "Advocacy-Oriented", "Awareness-Focused",
            "Community Mobilization", "Justice-Oriented", "Reformist", "Ethical / Moral"
        ],
        "Viral Social Media Styles": [
            "Trend-Jacking", "Hook-Heavy", "Short-Form Viral", "Rage-Bait",
            "Curiosity-Driven", "Reaction Style", "Screenshot / Text Style",
            "Twitter-Like Commentary", "Influencer Style", "POV Style"
        ]
    }
}

def seed_taxonomy(db: Session):
    logger.info("Checking taxonomy data seeding status...")
    for cat_name, primaries in TAXONOMY_DATA.items():
        # Get or create Category
        category = db.query(Category).filter(Category.name == cat_name).first()
        if not category:
            logger.info(f"Seeding Category: '{cat_name}'")
            category = Category(name=cat_name)
            db.add(category)
            db.commit()
            db.refresh(category)

        for prim_name, secondaries in primaries.items():
            # Get or create PrimarySubcategory
            primary = db.query(PrimarySubcategory).filter(
                PrimarySubcategory.category_id == category.id,
                PrimarySubcategory.name == prim_name
            ).first()
            if not primary:
                logger.info(f"  Seeding Primary Subcategory: '{prim_name}'")
                primary = PrimarySubcategory(category_id=category.id, name=prim_name)
                db.add(primary)
                db.commit()
                db.refresh(primary)

            for sec_name in secondaries:
                # Get or create SecondarySubcategory
                secondary = db.query(SecondarySubcategory).filter(
                    SecondarySubcategory.primary_subcategory_id == primary.id,
                    SecondarySubcategory.name == sec_name
                ).first()
                if not secondary:
                    logger.info(f"    Seeding Secondary Subcategory: '{sec_name}'")
                    secondary = SecondarySubcategory(primary_subcategory_id=primary.id, name=sec_name)
                    db.add(secondary)
    db.commit()
    logger.success("Taxonomy database seeding completed successfully.")
