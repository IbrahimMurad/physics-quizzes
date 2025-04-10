from django.contrib import admin
from .models import TextBook, Unit, Chapter, Lesson


admin.site.register(TextBook)
admin.site.register(Unit)
admin.site.register(Chapter)
admin.site.register(Lesson)

