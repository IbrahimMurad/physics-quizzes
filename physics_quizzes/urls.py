"""
URL configuration for physics_quizzes project.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.auth.views import LoginView, LogoutView
from django.urls import path, include, re_path
from scope.views import index, units, chapters, lessons
from exam.views import exam_create, exam_view, submit_exam, exam_result

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
        "auth/logout/",
        LogoutView.as_view(
            template_name="user_profile/logout.html",
        ),
        name="logout",
    ),
    path("textbook/<int:textbook_id>/units", units, name="units"),
    path("unit/<int:unit_id>/chapters", chapters, name="chapters"),
    path("chapter/<int:chapter_id>/lessons", lessons, name="lessons"),
    path("exam/create/", exam_create, name="exam-create"),
    path("exam/<int:exam_id>/", exam_view, name="exam"),
    path("exam/<int:exam_id>/solve/", submit_exam, name="exam-solve"),
    path("exam/submission/<int:submission_id>/", exam_result, name="exam-result"),
    re_path(r"^_nested_admin/", include("nested_admin.urls")),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
