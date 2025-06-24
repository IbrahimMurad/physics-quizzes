from django.shortcuts import redirect, render

from .forms import UserRegistrationForm
from .models import Profile


def register(request):
    if request.method == "POST":
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            Profile.objects.create(user=user)
            return redirect("login")
        else:
            print(form.errors)
    else:
        form = UserRegistrationForm()
    return render(request, "user_profile/register.html", {"form": form})
