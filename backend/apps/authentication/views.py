from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from .models import SocialConnection
import requests
from urllib.parse import urlencode
from .serializers import UserSerializer, SocialConnectionSerializer
from django.conf import settings

# Create your views here.
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny] 

class UserProfileView(APIView):
    """
    View to get the authenticated user's profile (requires authentication)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ConnectSocialView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, platform):
        if platform not in ['google', 'tiktok', 'facebook']:
            return Response({"error": "Invalid platform"}, status=status.HTTP_400_BAD_REQUEST)
        
        auth_code = request.data.get('code')
        if not auth_code:
            return Response({"error": "Authorization code required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Exchange auth code for tokens
        token_data = self.exchange_code(platform, auth_code)
        if not token_data:
            return Response({"error": "Failed to authenticate with platform"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get user profile
        profile = self.get_profile(platform, token_data['access_token'])
        if not profile:
            return Response({"error": "Failed to fetch profile"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create/update connection
        SocialConnection.objects.update_or_create(
            user=request.user,
            platform=platform,
            defaults={
                'access_token': token_data['access_token'],
                'refresh_token': token_data.get('refresh_token'),
                'expires_at': self.calculate_expiry(token_data.get('expires_in')),
                'platform_user_id': profile['id']
            }
        )
        
        return Response({"status": f"{platform} account connected"})
    
    def exchange_code(self, platform, code):
        # Configure these in your settings.py
        CLIENT_DATA = {
            'google': {
                'client_id': settings.GOOGLE_CLIENT_ID,
                'client_secret': settings.GOOGLE_CLIENT_SECRET,
                'token_url': 'https://oauth2.googleapis.com/token',
                'redirect_uri': settings.GOOGLE_REDIRECT_URI
            },
            'tiktok': {
                'client_id': settings.TIKTOK_CLIENT_KEY,
                'client_secret': settings.TIKTOK_CLIENT_SECRET,
                'token_url': 'https://open.tiktokapis.com/v2/oauth/token/',
                'redirect_uri': settings.TIKTOK_REDIRECT_URI
            },
            'facebook': {
                'client_id': settings.FACEBOOK_APP_ID,
                'client_secret': settings.FACEBOOK_APP_SECRET,
                'token_url': 'https://graph.facebook.com/v12.0/oauth/access_token',
                'redirect_uri': settings.FACEBOOK_REDIRECT_URI
            }
        }
        
        data = {
            'code': code,
            'client_id': CLIENT_DATA[platform]['client_id'],
            'client_secret': CLIENT_DATA[platform]['client_secret'],
            'redirect_uri': CLIENT_DATA[platform]['redirect_uri'],
            'grant_type': 'authorization_code'
        }
        
        response = requests.post(CLIENT_DATA[platform]['token_url'], data=data)

        print(response.json())

        return response.json() if response.status_code == 200 else None
    
    def get_profile(self, platform, access_token):
        PROFILE_URLS = {
            'google': 'https://www.googleapis.com/oauth2/v2/userinfo',
            'tiktok': 'https://open.tiktokapis.com/v2/user/info/',
            'facebook': 'https://graph.facebook.com/me?fields=id,name,email'
        }
        
        headers = {'Authorization': f'Bearer {access_token}'}
        response = requests.get(PROFILE_URLS[platform], headers=headers)
        return response.json() if response.status_code == 200 else None
    
    def calculate_expiry(self, expires_in):
        if not expires_in:
            return None
        from django.utils.timezone import now
        from datetime import timedelta
        return now() + timedelta(seconds=expires_in)

class ListConnectionsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        connections = SocialConnection.objects.filter(user=request.user)
        serializer = SocialConnectionSerializer(connections, many=True)
        return Response(serializer.data)

class DisconnectView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, platform):
        connection = get_object_or_404(SocialConnection, user=request.user, platform=platform)
        connection.delete()
        return Response({"status": f"{platform} account disconnected"})