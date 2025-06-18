from django.shortcuts import redirect, render

from .forms import UserRegistrationForm


def register(request):
    if request.method == "POST":
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect("login")
        else:
            print(form.errors)
    else:
        form = UserRegistrationForm()
    return render(request, "user_profile/register.html", {"form": form})
