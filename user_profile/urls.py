from django.contrib.auth import views as auth_views
from django.urls import path, reverse_lazy

from user_profile.views import CustomLoginView, profile_view, register, update_profile

urlpatterns = [
    # Authentication URLs
    path(
        "login/",
        CustomLoginView.as_view(),
        name="login",
    ),
    path(
        "register/",
        register,
        name="register",
    ),
    path(
        "logout/",
        auth_views.LogoutView.as_view(
            template_name="user_profile/logout.html", next_page="login"
        ),
        name="logout",
    ),
    # Password Reset URLs
    path(
        "password-reset/",
        auth_views.PasswordResetView.as_view(
            template_name="user_profile/password_reset.html",
            email_template_name="user_profile/password_reset_email.html",
            subject_template_name="user_profile/password_reset_subject.txt",
            success_url=reverse_lazy("password_reset_done"),
        ),
        name="password_reset",
    ),
    path(
        "password-reset/done/",
        auth_views.PasswordResetDoneView.as_view(
            template_name="user_profile/password_reset_done.html"
        ),
        name="password_reset_done",
    ),
    path(
        "password-reset/<uidb64>/<token>/",
        auth_views.PasswordResetConfirmView.as_view(
            template_name="user_profile/password_reset_confirm.html",
            success_url=reverse_lazy("password_reset_complete"),
        ),
        name="password_reset_confirm",
    ),
    path(
        "password-reset/complete/",
        auth_views.PasswordResetCompleteView.as_view(
            template_name="user_profile/password_reset_complete.html"
        ),
        name="password_reset_complete",
    ),
    # Password Change URLs (for authenticated users)
    path(
        "password-change/",
        auth_views.PasswordChangeView.as_view(
            template_name="user_profile/password_change.html",
            success_url=reverse_lazy("password_change_done"),
        ),
        name="password_change",
    ),
    path(
        "password-change/done/",
        auth_views.PasswordChangeDoneView.as_view(
            template_name="user_profile/password_change_done.html"
        ),
        name="password_change_done",
    ),
    # Profile URLs
    path(
        "profile/",
        profile_view,
        name="profile",
    ),
    path(
        "profile/update/",
        update_profile,
        name="update_profile",
    ),
]
