from django.contrib import admin

from .models import Scope


class ScopeAdmin(admin.ModelAdmin):
    list_display = ("title", "level", "is_published")
    list_filter = ("level", "is_published", "parent")
    search_fields = ["title"]

    @admin.action(description="Publish selected scopes")
    def publish(self, request, queryset):
        queryset.update(is_published=True)

    @admin.action(description="Unpublish selected scopes")
    def unpublish(self, request, queryset):
        queryset.update(is_published=False)

    actions = [publish, unpublish]


admin.site.register(Scope, ScopeAdmin)
