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


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    inlines = [ChapterInline]


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    inlines = [LessonInline]


admin.site.register(Lesson)
