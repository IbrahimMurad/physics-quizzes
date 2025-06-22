from django.contrib.auth.views import LoginView, LogoutView
from django.urls import path

from user_profile.views import register

urlpatterns = [
    path(
        "login/",
        LoginView.as_view(
            template_name="user_profile/login.html", redirect_authenticated_user=True
        ),
        name="login",
    ),
    path(
        "register/",
        register,
        name="register",
    ),
    path(
        "logout/",
        LogoutView.as_view(
            template_name="user_profile/logout.html",
        ),
        name="logout",
    ),
]
