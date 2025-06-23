from django.urls import path

from scope.views import (
    chapters,
    get_chapters,
    get_lessons,
    get_units,
    index,
    lessons,
    units,
)

urlpatterns = [
    path("", index, name="textbooks"),
    path("textbook/<int:textbook_id>/units/", units, name="units"),
    path("unit/<int:unit_id>/chapters/", chapters, name="chapters"),
    path("chapter/<int:chapter_id>/lessons/", lessons, name="lessons"),
    path("textbook/<int:textbook_id>/units/json/", get_units, name="get_units"),
    path("unit/<int:unit_id>/chapters/json/", get_chapters, name="get_chapters"),
    path("chapter/<int:chapter_id>/lessons/json/", get_lessons, name="get_lessons"),
]
