# crawler/services/article_service.py
from ..models import Article
from ..utils import fetch_wikipedia_article  # Hàm crawl từ Wikipedia

class ArticleService:
    @staticmethod
    def get_articles(keyword=None, limit=5, auto_fetch=True):
        """Lấy bài viết từ DB, nếu không có thì crawl mới"""
        queryset = Article.objects.filter(title__icontains=keyword) if keyword else Article.objects.all()
        articles = list(queryset[:limit])
        
        if not articles and keyword and auto_fetch:
            fetched_data = fetch_wikipedia_article(keyword)
            if fetched_data:
                article, _ = Article.objects.get_or_create(
                    url=fetched_data['url'],
                    defaults={
                        'title': fetched_data['title'],
                        'content': fetched_data['content'],
                        'source': 'Wikipedia'
                    }
                )
                articles = [article]
        
        return articles