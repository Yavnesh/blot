from gnews import GNews
import json

google_news = GNews(max_results=1)
items = google_news.get_news("Data Protection Act vs RTI Act India")
if items:
    print(json.dumps(items[0], indent=2))
else:
    print("No item found")
