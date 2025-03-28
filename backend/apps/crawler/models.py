from django.db import models

class DataSource(models.Model):
    name = models.CharField(max_length=100)
    url = models.URLField()
    api_key = models.CharField(max_length=255, null=True, blank=True)  # for APIs

class ScrapedData(models.Model):
    source = models.ForeignKey(DataSource, on_delete=models.CASCADE)
    raw_data = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class CleanedData(models.Model):
    scraped_data = models.OneToOneField(ScrapedData, on_delete=models.CASCADE)
    cleaned_content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
