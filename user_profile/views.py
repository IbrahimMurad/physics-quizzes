import logging

from django.conf import settings
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth.views import LoginView as DjangoLoginView
from django.core.mail import send_mail
from django.shortcuts import redirect, render
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_protect

from .forms import LoginForm, UserRegistrationForm
from .models import Profile

logger = logging.getLogger(__name__)


@csrf_protect
@never_cache
def register(request):
    """Handle user registration with enhanced security and UX."""
    if request.user.is_authenticated:
        return redirect("home")

    if request.method == "POST":
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            try:
                # Create user but don't activate yet
                user = form.save(commit=False)
                user.is_active = True  # Set to False if you want email verification
                user.save()

                # Create user profile
                Profile.objects.create(user=user)

                # Log the registration
                logger.info(f"New user registered: {user.username}")

                # Send welcome email (optional)
                try:
                    send_welcome_email(user)
                except Exception as e:
                    logger.error(f"Failed to send welcome email: {e}")

                # Add success message
                messages.success(
                    request, "Registration successful! Please log in to continue."
                )

                # Auto-login after registration (optional)
                # username = form.cleaned_data.get('username')
                # password = form.cleaned_data.get('password1')
                # user = authenticate(username=username, password=password)
                # if user:
                #     login(request, user)
                #     return redirect('home')

                return redirect("login")

            except Exception as e:
                logger.error(f"Registration error: {e}")
                messages.error(
                    request, "An error occurred during registration. Please try again."
                )
        else:
            # Form errors will be displayed in template
            messages.error(request, "Please correct the errors below.")
    else:
        form = UserRegistrationForm()

    return render(
        request,
        "user_profile/register.html",
        {"form": form, "title": "Register - QuizCraft"},
    )


class CustomLoginView(DjangoLoginView):
    """Enhanced login view with remember me functionality."""

    template_name = "user_profile/login.html"
    redirect_authenticated_user = True
    form_class = LoginForm

    def form_valid(self, form):
        """Handle successful login with remember me option."""
        remember_me = form.cleaned_data.get("remember_me")

        if not remember_me:
            # Session expires when browser closes
            self.request.session.set_expiry(0)
            self.request.session.modified = True
        else:
            # Session expires after 30 days
            self.request.session.set_expiry(2592000)

        # Log successful login
        logger.info(f"User logged in: {form.cleaned_data.get('username')}")

        # Add welcome message
        messages.success(
            self.request, f"Welcome back, {form.cleaned_data.get('username')}!"
        )

        return super().form_valid(form)

    def form_invalid(self, form):
        """Handle failed login attempt."""
        username = form.data.get("username")
        logger.warning(f"Failed login attempt for username: {username}")
        messages.error(self.request, "Invalid username or password.")
        return super().form_invalid(form)

    def get_redirect_url(self):
        """Validate redirect URL for security."""
        redirect_to = self.request.POST.get("next", self.request.GET.get("next", ""))

        # Ensure the redirect URL is safe
        if redirect_to and url_has_allowed_host_and_scheme(
            url=redirect_to,
            allowed_hosts={self.request.get_host()},
            require_https=self.request.is_secure(),
        ):
            return redirect_to

        return super().get_redirect_url()


@login_required
def profile_view(request):
    """Display user profile."""
    profile = request.user.profile
    return render(
        request,
        "user_profile/profile.html",
        {"profile": profile, "title": f"{request.user.username}'s Profile - QuizCraft"},
    )


@login_required
@csrf_protect
def update_profile(request):
    """Update user profile information."""
    if request.method == "POST":
        # Handle profile update logic
        user = request.user

        # Update email if changed
        new_email = request.POST.get("email")
        if new_email and new_email != user.email:
            if User.objects.filter(email=new_email).exclude(pk=user.pk).exists():
                messages.error(request, "This email is already in use.")
            else:
                user.email = new_email
                user.save()
                messages.success(request, "Email updated successfully.")

        return redirect("profile")

    return render(
        request,
        "user_profile/update_profile.html",
        {"title": "Update Profile - QuizCraft"},
    )


def send_welcome_email(user):
    """Send welcome email to new users."""
    subject = "Welcome to QuizCraft!"
    message = f"""
    Hi {user.username},
    
    Welcome to QuizCraft! We're excited to have you on board.
    
    Start exploring our study materials and create your own quizzes to enhance your learning experience.
    
    If you have any questions, feel free to reach out to our support team.
    
    Best regards,
    The QuizCraft Team
    """

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=True,
    )
