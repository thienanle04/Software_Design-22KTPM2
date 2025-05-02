from django.contrib.auth.models import User
from rest_framework import serializers
from .models import SocialConnection

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
    

class SocialConnectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialConnection
        fields = ['platform', 'date_connected']
        read_only_fields = ['date_connected']