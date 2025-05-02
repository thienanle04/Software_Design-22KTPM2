from django.urls import path, include
from .views import CreateUserView, UserProfileView, ConnectSocialView, ListConnectionsView, DisconnectView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

urlpatterns = [
    path("user/", include("rest_framework.urls")), 
    path("register/", CreateUserView.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="get_token"),
    path("refresh/", TokenRefreshView.as_view(), name="refresh_token"),
    path("me/", UserProfileView.as_view(), name="user_profile"),
    path('social/connect/<str:platform>/', ConnectSocialView.as_view()),
    path('social/connections/', ListConnectionsView.as_view()),
    path('social/disconnect/<str:platform>/', DisconnectView.as_view()),
    
]