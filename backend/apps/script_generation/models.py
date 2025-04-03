from django.db import models
from apps.image_video_generation.models import Video

class Script(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    style = models.CharField(max_length=50, choices=[('simple', 'Simple'), ('detailed', 'Detailed')])
    created_at = models.DateTimeField(auto_now_add=True)

class ScriptVersion(models.Model):
    script = models.ForeignKey(Script, on_delete=models.CASCADE)
    version_content = models.TextField()
    version_number = models.IntegerField()
    modified_at = models.DateTimeField(auto_now=True)

