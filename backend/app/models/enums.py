import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    CREATOR = "creator"
    MEMBER = "member"

class ReviewStatus(str, enum.Enum):
    DRAFTING = "drafting"
    AWAITING_CREATOR_REVIEW = "awaiting_creator_review"
    SUBMITTED_TO_MANAGER = "submitted_to_manager"
    CHANGES_REQUESTED = "changes_requested"
    MANAGER_APPROVED = "manager_approved"
    PUBLISHING = "publishing"
    PUBLISHED = "published"
    FAILED = "failed"

class ContentPlatform(str, enum.Enum):
    BLOG = "blog"
    LINKEDIN = "linkedin"
    TWITTER = "twitter"
    INSTAGRAM = "instagram"
    FACEBOOK = "facebook"
    MEDIUM = "medium"
