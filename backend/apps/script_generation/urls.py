from django.urls import path
from .views import ScienceStoryView, SimplifiedScienceView

urlpatterns = [
    path('science-stories/', ScienceStoryView.as_view(), name='science-stories'),
    path('simplified-science/', SimplifiedScienceView.as_view(), name='simplified-science'),
]