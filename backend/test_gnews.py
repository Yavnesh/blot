from gnews import GNews

google_news = GNews(max_results=5)
items = google_news.get_news("Artificial Intelligence")
if items:
    print(f"Found {len(items)} news items")
    for item in items[:2]:
        print(f"- {item['title']} ({item['url']})")
else:
    print("No news items found")
