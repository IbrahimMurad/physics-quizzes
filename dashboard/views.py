from django.contrib.auth.decorators import login_required
from django.db.models import Avg, Count
from django.shortcuts import render, reverse

from exam.models import Submission
from exam.utils import get_exams


@login_required
def dashboard(request):
    submissions = Submission.objects.filter(
        user=request.user, score__isnull=False
    ).order_by("-updated_at")

    submissions_stats = submissions.aggregate(
        count=Count("id"), average_score=Avg("percentage")
    )

    prev_avg_score = 0
    if submissions_stats["count"] > 1:
        prev_avg_score = submissions[1:].aggregate(
            avg_score=Avg("percentage")
        )["avg_score"]

    context = {
        "stats": [
            {
                "title": "Exams Completed",
                "count": submissions_stats["count"],
                "icon": "⏱️",
                "url": reverse("exam-list"),
                "trend": None,
            },
            {
                "title": "Average Score",
                "count": submissions_stats["average_score"],
                "icon": "⭐",
                "url": None,
                "trend": submissions_stats["average_score"] - prev_avg_score
                if submissions_stats["average_score"] and prev_avg_score
                else None,
            },
        ],
        "favorites": request.user.profile.favorites.filter(is_published=True),
        "recent_exams": get_exams(request=request, limit=5),
    }
    return render(request, "dashboard/dashboard.html", context)
