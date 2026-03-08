# Import all the models, so that Base has them before being
# imported by Alembic
from app.db.base_class import Base
from app.models.scrape import Scrape
from app.models.twitter_post import TwitterPost
from app.models.trending import Trending
from app.models.post import Post
from app.models.fine_tune_data import FineTuneData
from app.models.task_progress import TaskProgress
from app.models.modular_models import *
