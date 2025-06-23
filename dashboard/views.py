from django.contrib.auth.decorators import login_required
from django.db.models import Avg
from django.shortcuts import render

from exam.models import Submission
from scope.models import TextBook


@login_required
def dashboard(request):
    context = {
        "exams_completed": request.user.submissions.filter(
            status=Submission.Status.COMPLETED
        ).count(),
        "textbooks": TextBook.objects.all(),
        "average_score": request.user.submissions.filter(
            status=Submission.Status.COMPLETED
        ).aggregate(Avg("score"))["score__avg"],
        "recent_exams": request.user.submissions.all()[:3],
    }
    print(context)
    return render(request, "dashboard/dashboard.html", context)
