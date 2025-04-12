from django.shortcuts import render, get_object_or_404
from scope.models import TextBook, Unit, Chapter, Lesson


def index(request):
    textbooks = TextBook.objects.all()
    return render(
        request, "scope/index.html", {"title": "Textbooks", "scopes": textbooks}
    )


def units(request, textbook_id):
    textbook = get_object_or_404(TextBook, id=textbook_id)
    units = Unit.objects.filter(textbook=textbook)
    return render(
        request,
        "scope/index.html",
        {"title": textbook.title, "scopes": units},
    )


def chapters(request, unit_id):
    unit = get_object_or_404(Unit, id=unit_id)
    chapters = Chapter.objects.filter(unit=unit)
    return render(
        request,
        "scope/index.html",
        {"title": unit.title, "scopes": chapters},
    )


def lessons(request, chapter_id):
    chapter = get_object_or_404(Chapter, id=chapter_id)
    lessons = Lesson.objects.filter(chapter=chapter)
    return render(
        request,
        "scope/index.html",
        {"title": chapter.title, "scopes": lessons},
    )
