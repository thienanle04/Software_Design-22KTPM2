from django.db import models

class Voice(models.Model):
    provider = models.CharField(max_length=50)
    language = models.CharField(max_length=10)
    voice_type = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.provider} ({self.language}, {self.voice_type})"

class GeneratedVoice(models.Model):
    voice = models.ForeignKey(Voice, on_delete=models.CASCADE)
    text = models.TextField(null=True, blank=True)
    audio_file = models.FileField(upload_to='generated_audio/', null=True, blank=True)
    pitch_shift = models.FloatField(default=1.0)
    speed = models.FloatField(default=1.0)
    duration = models.FloatField(null=True, blank=True)  # New field for audio duration
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"GeneratedVoice (pitch={self.pitch_shift}, speed={self.speed})"