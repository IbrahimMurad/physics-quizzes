"""
URL configuration for physics_quizzes project.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.auth.views import LoginView, LogoutView
from django.urls import include, path, re_path

from exam.views import get_chapters, get_lessons, get_units
from scope.views import chapters, index, lessons, units
from user_profile.views import register

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", index, name="home"),
    path(
        "auth/login/",
        LoginView.as_view(
            template_name="user_profile/login.html", redirect_authenticated_user=True
        ),
        name="login",
    ),
    path(
        "auth/register/",
        register,
        name="register",
    ),
    path(
        "auth/logout/",
        LogoutView.as_view(
            template_name="user_profile/logout.html",
        ),
        name="logout",
    ),
    path("textbook/<int:textbook_id>/units/", units, name="units"),
    path("unit/<int:unit_id>/chapters/", chapters, name="chapters"),
    path("chapter/<int:chapter_id>/lessons/", lessons, name="lessons"),
    path("textbook/<int:textbook_id>/units/json/", get_units, name="get_units"),
    path("unit/<int:unit_id>/chapters/json/", get_chapters, name="get_chapters"),
    path("chapter/<int:chapter_id>/lessons/json/", get_lessons, name="get_lessons"),
    path("exam/", include("exam.urls")),
    re_path(r"^_nested_admin/", include("nested_admin.urls")),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
