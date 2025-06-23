from django.contrib.auth.decorators import login_required
from django.db.models import Avg
from django.shortcuts import render, reverse

from exam.models import Submission
from scope.models import TextBook


@login_required
def dashboard(request):
    submissions = Submission.objects.filter(
        user=request.user, score__isnull=False
    ).order_by("-updated_at")

    submissions_count = submissions.count()

    avg_score = submissions.aggregate(avg_score=Avg("score"))["avg_score"]

    prev_avg_score = submissions[: submissions_count - 1].aggregate(
        avg_score=Avg("score")
    )["avg_score"]

    context = {
        "stats": [
            {
                "title": "Exams Completed",
                "count": submissions_count,
                "icon": "⏱️",
                "url": reverse("exam-list"),
                "trend": None,
            },
            {
                "title": "Average Score",
                "count": avg_score,
                "icon": "⭐",
                "url": None,
                "trend": avg_score - prev_avg_score,
            },
        ],
        "My_lessons": request.user.profile.lessons.all(),
        "recent_exams": Submission.objects.filter(user=request.user).exclude(
            status=Submission.Status.EXITED_UNEXPECTEDLY
        ),
    }
    print(context)
    return render(request, "dashboard/dashboard.html", context)
