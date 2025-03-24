from django.db import models
from apps.image_video_generation.models import Video

class Voice(models.Model):
    video = models.ForeignKey(Video, related_name="voices", on_delete=models.CASCADE)
    voice_type = models.CharField(max_length=50, choices=[('ai', 'AI'), ('human', 'Human')])
    voice_service = models.CharField(max_length=50, choices=[('google', 'Google TTS'), ('amazon', 'Amazon Polly'), ('elevenlabs', 'Eleven Labs')])
    language = models.CharField(max_length=50)
    speed = models.FloatField(default=1.0)  # Tốc độ đọc
    tone = models.FloatField(default=1.0)  # Âm điệu
    preview_url = models.URLField(null=True, blank=True)  # Link nghe thử

    def __str__(self):
        return f"Voice for {self.video.title}"
