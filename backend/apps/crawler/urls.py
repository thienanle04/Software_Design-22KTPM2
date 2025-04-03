from django.urls import path
from .views import WikipediaCrawlerView

urlpatterns = [
    path('wikipedia/', WikipediaCrawlerView.as_view(), name='wikipedia_crawler'),
]
