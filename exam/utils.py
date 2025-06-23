from django.shortcuts import redirect

from exam.models import Submission
from scope.models import Chapter, Lesson, TextBook, Unit

scope_types = {
    "Lesson": Lesson,
    "Chapter": Chapter,
    "Unit": Unit,
    "Textbook": TextBook,
}

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
        .select_related("exam")
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
                    "scope_type": submission.exam.scope_type,
                    "scope_title": scope_types[submission.exam.scope_type]
                    .objects.get(id=submission.exam.scope_id)
                    .title,
                    "created_at": submission.exam.created_at,
                },
                "score": submission.score,
                "percentage": submission.percentage,
                "exam_length": submission.exam.problems.count(),
                "is_solved": submission.status == Submission.Status.COMPLETED
                and submission.score,
            }
            for submission in submissions
        ]
    }

    return context
