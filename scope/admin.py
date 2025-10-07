from django.contrib import admin, messages
from django.contrib.admin import SimpleListFilter
from django.utils.translation import gettext_lazy as _

from problem.admin import ProblemInline

from .models import Scope


class ParentFilter(SimpleListFilter):
    title = _("parent")
    parameter_name = "parent"

    def lookups(self, request, model_admin):
        level = request.GET.get("level__exact", None)
        parents = Scope.objects.all()

        if level:
            # Get the level of the selected parent
            parent_level = int(level) - 1
            parents = parents.filter(level=parent_level)
        else:
            parents.filter(parent__isnull=True)

        return [(p.id, str(p)) for p in parents]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(parent_id=self.value())
        return queryset


class ScopeInline(admin.StackedInline):
    model = Scope
    extra = 0


class ScopeAdmin(admin.ModelAdmin):
    list_display = ("title", "level", "is_published", "parent")
    list_filter = ("level", "is_published", ParentFilter)
    search_fields = ["title"]
    inlines = [ScopeInline, ProblemInline]

    @admin.action(description="Publish selected scopes")
    def publish(self, request, queryset):
        queryset.update(is_published=True)
        if queryset.filter(is_published=True).exists():
            messages.success(request, "Selected scopes published successfully")
        else:
            messages.error(request, "No scopes selected")

    @admin.action(description="Unpublish selected scopes")
    def unpublish(self, request, queryset):
        queryset.update(is_published=False)
        for scope in queryset:
            if scope.children.exists():
                scope.children.update(is_published=False)
                self.unpublish(request, scope.children.all())
        messages.success(request, "Selected scopes unpublished successfully")

    actions = [publish, unpublish]


admin.site.register(Scope, ScopeAdmin)
