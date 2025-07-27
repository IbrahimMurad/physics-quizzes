from django.db.models import Exists, OuterRef
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
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
    """
    Renders the scope browser page

    If the slug parameter is given, it renders the page for that scope.
    Otherwise, it renders the page for the textbooks.

    The page shows the given scope and its children, and also includes
    the breadcrumbs to the given scope.

    The children are annotated with a boolean field "is_fav" indicating
    whether the user has favorited the scope.

    If the user is anonymous, all scopes are treated as not favorited.
    """
    if not request.user.is_authenticated:
        # If anonymous, treat all as not favorite
        favorites_subquery = Scope.objects.none()
    else:
        favorites_subquery = request.user.profile.favorites.filter(id=OuterRef("id"))

    if slug:
        scope = get_object_or_404(Scope.objects.prefetch_related("children"), slug=slug)
        children = scope.children.annotate(is_fav=Exists(favorites_subquery))
        breadcrumbs = _get_breadcrumbs(scope)
    else:
        scope = None
        children = Scope.objects.filter(parent__isnull=True).annotate(
            is_fav=Exists(favorites_subquery)
        )
        breadcrumbs = []

    return render(
        request,
        "scope/index.html",
        context={
            "title": scope.title if scope else "Textbooks",
            "list_title": f"{children[0].type}s" if scope else "Textbooks",
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


@require_http_methods(["POST"])
def favorites(request):
    """Add and remove scopes from user favorites"""

    favorites = request.user.profile.favorites
    scope_id = request.POST.get("scope_id")
    scope = get_object_or_404(Scope, id=scope_id)
    if favorites.filter(id=scope_id).exists():
        favorites.remove(scope)
        message = f"{scope} removed from favorites successfully"
    else:
        favorites.add(scope)
        message = f"{scope} added to favorites successfully"
    return JsonResponse({"message": message}, status=200)
