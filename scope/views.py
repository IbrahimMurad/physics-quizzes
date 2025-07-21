from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from django.urls import reverse
from django.views.decorators.http import require_http_methods

from scope.models import Scope


def _get_breadcrumbs(scope) -> list[Scope]:
    """Builds the breadcrumbs of the scope"""
    breadcrumbs = []
    while scope:
        breadcrumbs.insert(0, scope)
        scope = scope.parent
    return breadcrumbs


def scope_browser(request, slug=None):
    if slug:
        scope = get_object_or_404(Scope.objects.prefetch_related("children"), slug=slug)
        children = scope.children.all()
        breadcrumbs = _get_breadcrumbs(scope)
    else:
        scope = None
        children = Scope.objects.filter(parent__isnull=True)
        breadcrumbs = []

    return render(
        request,
        "scope/index.html",
        context={
            "title": scope.title if scope else "Textbooks",
            "list_title": f"{scope.type}s" if scope else "Textbooks",
            "parent": scope,
            "scopes": children,
            "breadcrumbs": breadcrumbs,
        },
    )


@require_http_methods(["GET"])
def scope_list_api(request, id):
    scope = get_object_or_404(Scope.objects.prefetch_related("children"), id=id)
    children = scope.children.values("id", "title")
    return JsonResponse(list(children), safe=False)
