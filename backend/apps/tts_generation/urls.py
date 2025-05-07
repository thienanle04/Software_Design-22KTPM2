from django.urls import path
from .views import GenerateAudioView, GenerateVideoView

urlpatterns = [
    path('generate-audio/', GenerateAudioView.as_view(), name='generate-audio'),
    path('generate-video/', GenerateVideoView.as_view(), name='generate-video'),
]