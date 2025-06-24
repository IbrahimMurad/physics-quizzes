from django.shortcuts import redirect

from exam.models import Submission
from scope.models import Scope

scope_problem_number = {
    "Lesson": 10,
    "Chapter": 25,
    "Unit": 40,
    "Textbook": 50,
}


def reload(request):
    """Reloads the current page"""
    return redirect(request.META.get("HTTP_REFERER", "/"))


def get_submissions(request, limit=None) -> list:
    """returns the context for exams list"""
    submissions = (
        Submission.objects.filter(user=request.user)
        .select_related("exam", "exam__scope")
        .prefetch_related("exam__exam_problems")
    )
    if limit:
        submissions = submissions[:limit]
    context = {
        "submissions": [
            {
                "id": submission.id,
                "exam": {
                    "id": submission.exam.id,
                    "title": submission.exam.title,
                    "scope": {
                        "type": submission.exam.scope.type,
                        "title": submission.exam.scope.title,
                    },
                    "created_at": submission.exam.created_at,
                },
                "score": submission.score,
                "percentage": submission.percentage,
                "exam_length": scope_problem_number[str(submission.exam.scope.type)],
                "is_solved": submission.status == Submission.Status.COMPLETED
                and submission.score,
            }
            for submission in submissions
        ]
    }

    return context
