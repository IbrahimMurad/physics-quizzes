import nested_admin
from django.contrib import admin
from django.db.models import Q

from .models import Choice, Problem


class NestedChoiceInline(nested_admin.NestedTabularInline):
    model = Choice
    extra = 0


class ProblemInline(nested_admin.NestedTabularInline):
    model = Problem
    extra = 0
    inlines = [NestedChoiceInline]


class ChoiceInline(admin.TabularInline):
    model = Choice


class ProblemListFilter(admin.SimpleListFilter):
    title = "has_figure"
    parameter_name = "has_figure"

    def lookups(self, request, model_admin):
        return [
            ("with", "With figure"),
            ("without", "Without figure"),
        ]

    def queryset(self, request, queryset):
        if self.value() == "with":
            return queryset.filter(
                Q(figure__isnull=False) & ~Q(figure="")
                | Q(choice__figure__isnull=False) & ~Q(choice__figure="")
            ).distinct()
        if self.value() == "without":
            return queryset.exclude(
                Q(figure__isnull=False) & ~Q(figure="")
                | Q(choice__figure__isnull=False) & ~Q(choice__figure="")
            ).distinct()
        return queryset


class ProblemAdmin(admin.ModelAdmin):
    inlines = [ChoiceInline]
    list_display = ["body", "is_published"]
    list_filter = ["scope", "difficulty", "is_published", ProblemListFilter]
    search_fields = ["body"]

    @admin.action(description="Publish selected problems")
    def publish_problems(self, request, queryset):
        queryset.update(is_published=True)

    @admin.action(description="Unpublish selected problems")
    def unpublish_problems(self, request, queryset):
        queryset.update(is_published=False)

    actions = [publish_problems, unpublish_problems]


admin.site.register(Problem, ProblemAdmin)
admin.site.register(Choice)
