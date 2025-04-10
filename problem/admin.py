from django.contrib import admin
from .models import Problem, Choice

class ChoiceInline(admin.TabularInline):
    model = Choice

class ProblemAdmin(admin.ModelAdmin):
    inlines = [ChoiceInline]

admin.site.register(Problem, ProblemAdmin)
admin.site.register(Choice)

