from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services.content_processor import ContentProcessor
from rest_framework.permissions import AllowAny
class ScienceStoryView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        keyword = request.query_params.get('keyword', None)
        style = request.query_params.get('style', 'adventure')
        
        processor = ContentProcessor()
        articles = processor.get_articles_from_crawler(keyword)
        
        if not articles:
            return Response({"error": "No articles found"}, status=status.HTTP_404_NOT_FOUND)
        
        results = []
        for article in articles:
            story = processor.transform_to_story(article.content, style)
            results.append({
                "original_title": article.title,
                "story": story,
                "source": article.url
            })
        
        return Response({"stories": results})

class SimplifiedScienceView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        keyword = request.query_params.get('keyword', None)
        audience = request.query_params.get('audience', 'children')
        
        processor = ContentProcessor()
        articles = processor.get_articles_from_crawler(keyword)
        
        if not articles:
            return Response({"error": "No articles found"}, status=status.HTTP_404_NOT_FOUND)
        
        results = []
        for article in articles:
            simplified = processor.generate_simplified_explanation(article.content, audience)
            results.append({
                "original_title": article.title,
                "simplified_explanation": simplified,
                "audience": audience,
                "source": article.url
            })
        
        return Response({"explanations": results})