import re

from django import forms
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError


class UserRegistrationForm(UserCreationForm):
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(
            attrs={
                "class": "form-control",
                "placeholder": "Enter your email",
                "autocomplete": "email",
                "aria-describedby": "email-error",
            }
        ),
    )

    username = forms.CharField(
        max_length=150,
        required=True,
        widget=forms.TextInput(
            attrs={
                "class": "form-control",
                "placeholder": "Choose a username",
                "autocomplete": "username",
                "aria-describedby": "username-error",
            }
        ),
    )

    password1 = forms.CharField(
        widget=forms.PasswordInput(
            attrs={
                "class": "form-control",
                "placeholder": "Enter a strong password",
                "autocomplete": "new-password",
                "aria-describedby": "password-error",
            }
        )
    )

    password2 = forms.CharField(
        widget=forms.PasswordInput(
            attrs={
                "class": "form-control",
                "placeholder": "Confirm your password",
                "autocomplete": "new-password",
                "aria-describedby": "confirm-password-error",
            }
        )
    )

    class Meta:
        model = User
        fields = ["username", "email", "password1", "password2"]

    def clean_email(self):
        email = self.cleaned_data.get("email")
        if User.objects.filter(email=email).exists():
            raise ValidationError("An account with this email already exists.")
        return email

    def clean_username(self):
        username = self.cleaned_data.get("username")
        if len(username) < 3:
            raise ValidationError("Username must be at least 3 characters long.")
        if not re.match(r"^[a-zA-Z0-9_]+$", username):
            raise ValidationError(
                "Username can only contain letters, numbers, and underscores."
            )
        if User.objects.filter(username=username).exists():
            raise ValidationError("An account with this username already exists.")
        return username

    def clean_password1(self):
        password1 = self.cleaned_data.get("password1")
        if len(password1) < 8:
            raise ValidationError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", password1):
            raise ValidationError(
                "Password must contain at least one uppercase letter."
            )
        if not re.search(r"[a-z]", password1):
            raise ValidationError(
                "Password must contain at least one lowercase letter."
            )
        if not re.search(r"[0-9]", password1):
            raise ValidationError("Password must contain at least one number.")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password1):
            raise ValidationError(
                'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>).'
            )
        return password1

    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get("password1")
        password2 = cleaned_data.get("password2")

        if password1 and password2 and password1 != password2:
            raise ValidationError("Passwords do not match.")
        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data["email"]
        if commit:
            user.save()
        return user


class LoginForm(AuthenticationForm):
    remember_me = forms.BooleanField(
        required=False,
        widget=forms.CheckboxInput(
            attrs={"class": "form-check-input", "id": "remember-me"}
        ),
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Customize the username field
        self.fields["username"].widget.attrs.update({
            "class": "form-control",
            "placeholder": "Enter your username",
            "autocomplete": "username",
            "aria-describedby": "username-error",
            "aria-required": "true",
        })

        # Customize the password field
        self.fields["password"].widget.attrs.update({
            "class": "form-control",
            "placeholder": "Enter your password",
            "autocomplete": "current-password",
            "aria-describedby": "password-error",
            "aria-required": "true",
        })
