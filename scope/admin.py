from django.contrib import admin, messages

from .models import Scope


class ScopeAdmin(admin.ModelAdmin):
    list_display = ("title", "level", "is_published", "parent")
    list_filter = ("level", "is_published", "parent")
    search_fields = ["title"]

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
