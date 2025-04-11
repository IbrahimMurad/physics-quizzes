from django.shortcuts import render
from scope.models import TextBook


def index(request):
    textbooks = TextBook.objects.all()
    return render(
        request, "scope/index.html", {"title": "Textbooks", "textbooks": textbooks}
    )
