from django.urls import path
from .views import GenerateAudioView, GenerateMultiAudioView

urlpatterns = [
    path('generate-audio/', GenerateAudioView.as_view(), name='generate-audio'),
    path('generate-multi-audio/', GenerateMultiAudioView.as_view(), name='generate-multi-audio'),
]