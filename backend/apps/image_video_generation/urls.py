from django.urls import path
from . import views

urlpatterns = [
    path('generate-image/', views.generate_image, name='generate_image'),
    path('generate-images/', views.generate_images_from_story, name='generate_images'),
    # path('generate-video/', views.generate_video_from_image, name='generate_video'),
    # path('generate-video-from-text/', views.generate_video_from_text, name='generate_video_from_text'),
    path('create-video-from-images/', views.create_video_from_images, name='create_video_from_images'),
    path('user-videos/', views.UserVideosView.as_view(), name='user_videos'),
    path('delete-video/<int:video_id>/', views.delete_video, name='delete_video'),
    path('video/<int:video_id>/', views.get_video, name='get_video'),
    path('image/<int:image_id>/', views.get_image, name='get_image'),
]