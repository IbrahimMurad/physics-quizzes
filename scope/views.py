from django.shortcuts import render, get_object_or_404
from scope.models import TextBook, Unit, Chapter, Lesson


def index(request):
    textbooks = TextBook.objects.all()
    return render(
        request,
        "scope/index.html",
        context={
            "title": "Textbooks",
            "list_title": "Textbooks",
            "scopes": textbooks,
            "breadcrumbs": [],
        },
    )


def units(request, textbook_id):
    textbook = get_object_or_404(TextBook, id=textbook_id)
    units = Unit.objects.filter(textbook=textbook)
    return render(
        request,
        "scope/index.html",
        context={
            "title": textbook.title,
            "list_title": "Units",
            "parent": textbook,
            "scopes": units,
            "breadcrumbs": [textbook],
        },
    )


def chapters(request, unit_id):
    unit = get_object_or_404(Unit, id=unit_id)
    chapters = Chapter.objects.filter(unit=unit).prefetch_related("unit__textbook")
    return render(
        request,
        "scope/index.html",
        context={
            "parent": unit,
            "title": unit.title,
            "list_title": "Chapters",
            "scopes": chapters,
            "breadcrumbs": [unit.textbook, unit],
        },
    )


def lessons(request, chapter_id):
    chapter = get_object_or_404(Chapter, id=chapter_id)
    lessons = Lesson.objects.filter(chapter=chapter).prefetch_related(
        "chapter__unit__textbook"
    )
    return render(
        request,
        "scope/index.html",
        context={
            "parent": chapter,
            "title": chapter.title,
            "list_title": "Lessons",
            "scopes": lessons,
            "breadcrumbs": [
                chapter.unit.textbook,
                chapter.unit,
                chapter,
            ],
        },
    )
