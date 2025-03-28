from django.db import models
from apps.image_video_generation.models import Video

class Voice(models.Model):
    provider = models.CharField(max_length=50)
    language = models.CharField(max_length=50)
    voice_type = models.CharField(max_length=50)

class GeneratedVoice(models.Model):
    voice = models.ForeignKey(Voice, on_delete=models.CASCADE)
    audio_url = models.URLField()
    speed = models.FloatField()
    pitch = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
