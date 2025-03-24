from django.db import models
from apps.image_video_generation.models import Video

class Script(models.Model):
    video = models.ForeignKey(Video, related_name="scripts", on_delete=models.CASCADE)
    content = models.TextField()
    is_approved = models.BooleanField(default=False)
    last_edited = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Script for {self.video.title}"
