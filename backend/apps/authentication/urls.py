from django.urls import path, include
from .views import CreateUserView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

urlpatterns = [
    path("user/", include("rest_framework.urls")), 
    path("register/", CreateUserView.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="get_token"),
    path("refresh/", TokenRefreshView.as_view(), name="refresh_token"),
]