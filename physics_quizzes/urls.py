"""
URL configuration for physics_quizzes project.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path

from dashboard.views import dashboard

urlpatterns = [
    path("", dashboard, name="dashboard"),
    path("scope/", include("scope.urls")),
    path("exam/", include("exam.urls")),
    path("auth/", include("user_profile.urls")),
    path("admin/", admin.site.urls),
    re_path(r"^_nested_admin/", include("nested_admin.urls")),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
