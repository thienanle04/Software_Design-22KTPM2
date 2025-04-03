from django.http import JsonResponse
from django.views import View
from .utils import fetch_wikipedia_article,fetch_nature_articles, fetch_pubmed_articles, fetch_scientific_articles

class WikipediaCrawlerView(View):
    def get(self, request, *args, **kwargs):
        keyword = request.GET.get('keyword', 'Artificial_intelligence')
        data = fetch_scientific_articles(keyword)
        if data:
            return JsonResponse({"status": "success", "data": data})
        return JsonResponse({"status": "error", "message": "Không tìm thấy bài viết"}, status=404)
