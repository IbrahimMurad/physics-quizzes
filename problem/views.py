from django.contrib.auth.decorators import login_required, permission_required
from django.shortcuts import get_object_or_404, redirect, render

from problem.models import Problem
from scope.models import Scope
from scope.views import _get_breadcrumbs


@login_required()
@permission_required("problem.view_problem", raise_exception=True)
def problem_list(request):
    if not request.user.is_superuser:
        return redirect("dashboard")
    problems = Problem.objects.all()
    return render(request, "problem/problem_list.html", {"problems": problems})


@login_required()
def scope_problem_list(request, slug):
    if not request.user.is_superuser:
        return redirect("dashboard")
    scope = get_object_or_404(Scope, slug=slug)
    problems = scope.problems_set.all()
    return render(
        request,
        "problem/problem_list.html",
        {"problems": problems, "scope": scope, "breadcrumbs": _get_breadcrumbs(scope)},
    )
