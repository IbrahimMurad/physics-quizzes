from django.contrib import admin
import nested_admin
from problem.admin import ProblemInline
from .models import TextBook, Unit, Chapter, Lesson


class LessonInline(nested_admin.NestedTabularInline):
    model = Lesson
    extra = 0


@admin.register(Lesson)
class LessonAdmin(nested_admin.NestedModelAdmin):
    inlines = [ProblemInline]
    list_filter = ["chapter"]


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    inlines = [LessonInline]


class ChapterInline(nested_admin.NestedTabularInline):
    model = Chapter
    extra = 0
    inlines = [LessonInline]


@admin.register(Unit)
class UnitAdmin(nested_admin.NestedModelAdmin):
    inlines = [ChapterInline]


class UnitInline(admin.StackedInline):
    model = Unit


@admin.register(TextBook)
class TextBookAdmin(nested_admin.NestedModelAdmin):
    inlines = [UnitInline]
