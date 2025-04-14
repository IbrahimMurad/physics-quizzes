from django.contrib import admin
from .models import Problem, Choice
import nested_admin


class NestedChoiceInline(nested_admin.NestedTabularInline):
    model = Choice
    extra = 0


class ProblemInline(nested_admin.NestedTabularInline):
    model = Problem
    extra = 0
    inlines = [NestedChoiceInline]


class ChoiceInline(admin.TabularInline):
    model = Choice


class ProblemAdmin(admin.ModelAdmin):
    inlines = [ChoiceInline]


admin.site.register(Problem, ProblemAdmin)
admin.site.register(Choice)
