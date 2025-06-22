from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from django.views.decorators.http import require_http_methods

from scope.models import Chapter, Lesson, TextBook, Unit


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


@require_http_methods(["GET"])
def get_units(request, textbook_id):
    textbook = get_object_or_404(TextBook, id=textbook_id)
    units = textbook.units.values("id", "title")
    return JsonResponse(list(units), safe=False)


@require_http_methods(["GET"])
def get_chapters(request, unit_id):
    unit = get_object_or_404(Unit, id=unit_id)
    chapters = unit.chapters.values("id", "title")
    return JsonResponse(list(chapters), safe=False)


@require_http_methods(["GET"])
def get_lessons(request, chapter_id):
    chapter = get_object_or_404(Chapter, id=chapter_id)
    lessons = chapter.lessons.values("id", "title")
    return JsonResponse(list(lessons), safe=False)
