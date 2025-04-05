from django.urls import path
from . import views

urlpatterns = [
    path('generate-image/', views.generate_image, name='generate_image'),
    path('generate-video/', views.generate_video_from_image, name='generate_video'),
]