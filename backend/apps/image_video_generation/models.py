from django.db import models

class GeneratedImage(models.Model):
    image_url = models.URLField()
    generated_by = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

class GeneratedVideo(models.Model):
    video_url = models.URLField()
    images = models.ManyToManyField(GeneratedImage)
    created_at = models.DateTimeField(auto_now_add=True)

class VideoFrame(models.Model):
    video = models.ForeignKey(GeneratedVideo, on_delete=models.CASCADE)
    image = models.ForeignKey(GeneratedImage, on_delete=models.CASCADE)
    timestamp = models.FloatField()
