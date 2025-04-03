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
    def post(self, request):
        # Lấy dữ liệu từ body request
        content = request.data.get('content', None)
        style = request.data.get('style', 'adventure')
        
        if not content:
            return Response({"error": "Content is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        processor = ContentProcessor()
        
        try:
            story = processor.transform_to_story(content, style)
            return Response({
                "story": story,
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
    def post(self, request):
        # Lấy dữ liệu từ body request
        content = request.data.get('content', None)
        audience = request.data.get('audience', 'children')
        
        if not content:
            return Response({"error": "Content is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        processor = ContentProcessor()
        
        try:
            simplified = processor.generate_simplified_explanation(content, audience)
            return Response({
                "simplified_explanation": simplified,
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    