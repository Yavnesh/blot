import newspaper

url = "https://news.google.com/rss/articles/CBMiogFBVV95cUxNRGFYX3hxZmk0OGl3N2w0SjFzbFlzdHlDLU9QaDRsdVVnLTU5cExORHhCYlFZNlF0OVpFWWwzRWNoR1RfWFJmN0N5RGtkZTdVRWNRLVN6V2RZTFIwNEU2Rk1GdWV4b0lEeklpZnlNSEI0eEF1cmlqTVBFTTdjUzRFVUlGNnk3dVJTRUtLckFpbloxcjNCTHh3cV9GWElmRVZzb2fSAagBQVVfeXFMTkVxQ0w3N254MWV3V1JhZ3pXbzNwSGdvcWdrTDFXeW9QRlRxOWhCc1ZESjkwYndXdHNjQjVxWDVtSk9CaDhoM3Q4bkRNV1d5dGRZbWZmSkZxelFDTXYtQXlzYnBvTzdCQnpITEl4Q241SlpmcGQ3VDhpRGVOUXJrd0RackRQY1FDYzFHbE9WNVZTdDY2c0tKejk1eno2N0Y5bV8wREEzc1Nf?oc=5&hl=en-IN&gl=IN&ceid=IN:en"
article = newspaper.Article(url=url)
print(f"Initial: {article.url}")
article.download()
print(f"After Download: {article.url}")
# Check if there is another way to get the final URL
# Actually newspaper uses requests under the hood
import requests
r = requests.get(url, allow_redirects=True)
print(f"Requests Final: {r.url}")
