from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/auth/", include("apps.authentication.urls")),
    path('crawler/', include('apps.crawler.urls')),
     path('api/gen_script/', include('apps.script_generation.urls')),
]
