from django.db import models

class Article(models.Model):
    title = models.CharField(max_length=255)
    url = models.URLField(unique=True)
    content = models.TextField()
    source = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
