from django.contrib import admin
from .models import TextBook, Unit, Chapter, Lesson


class UnitInline(admin.TabularInline):
    model = Unit
    extra = 1


class ChapterInline(admin.TabularInline):
    model = Chapter
    extra = 1


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 1


@admin.register(TextBook)
class TextBookAdmin(admin.ModelAdmin):
    inlines = [UnitInline]
    list_display = ("title", "cover")


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    inlines = [ChapterInline]
    list_display = ("title", "textbook", "cover")


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    inlines = [LessonInline]
    list_display = ("title", "unit", "cover")


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ("title", "chapter", "cover")
    list_filter = ("chapter__unit__textbook",)
    search_fields = ("title", "chapter__title")
    ordering = ("chapter__unit__textbook", "chapter__unit", "chapter")
