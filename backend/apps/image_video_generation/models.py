from django.db import models
from django.contrib.auth.models import User


# class GeneratedImage(models.Model):
#     image_url = models.URLField()
#     generated_by = models.CharField(max_length=100)
#     created_at = models.DateTimeField(auto_now_add=True)

# class GeneratedVideo(models.Model):
#     video_url = models.URLField()
#     images = models.ManyToManyField(GeneratedImage)
#     created_at = models.DateTimeField(auto_now_add=True)

# class VideoFrame(models.Model):
#     video = models.ForeignKey(GeneratedVideo, on_delete=models.CASCADE)
#     image = models.ForeignKey(GeneratedImage, on_delete=models.CASCADE)
#     timestamp = models.FloatField()


class Video(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='videos')
    video_base64 = models.TextField()  # Store base64-encoded video
    resolution = models.CharField(max_length=20)  # e.g., "1024x576"
    frame_count = models.IntegerField()
    total_duration = models.FloatField()  # Duration in seconds
    created_at = models.DateTimeField(auto_now_add=True)
    prompt = models.TextField(blank=True)  # Optional: Store the prompt used to generate the video

    def __str__(self):
        return f"Video by {self.user.username} ({self.resolution}, {self.created_at})"