from django.urls import path
from .views import GenerateAudioView

urlpatterns = [
    path('generate-audio/', GenerateAudioView.as_view(), name='generate-audio'),
]