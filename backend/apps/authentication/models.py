from django.db import models
from django.contrib.auth.models import User

class SocialConnection(models.Model):
    PLATFORM_CHOICES = [
        ('google', 'Google'),
        ('tiktok', 'TikTok'),
        ('facebook', 'Facebook'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    access_token = models.TextField()
    refresh_token = models.TextField(blank=True, null=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    platform_user_id = models.CharField(max_length=255)
    date_connected = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'platform')

    def __str__(self):
        return f"{self.user.username} - {self.platform}"