from django.shortcuts import redirect

from exam.models import Exam

scope_problem_number = {
    "Lesson": 10,
    "Chapter": 25,
    "Unit": 40,
    "Textbook": 50,
}


def reload(request):
    """Reloads the current page"""
    return redirect(request.META.get("HTTP_REFERER", "/"))


def get_exams(request, limit=None, solved=False) -> list:
    """returns the context for exams list"""

    exams = Exam.objects.filter(created_by=request.user).prefetch_related(
        "scopes", "submissions", "exam_problems"
    )
    if limit:
        exams = exams[:limit]
    if solved:
        exams = exams.filter(submissions__user=request.user)
    return [
        {
            "id": exam.id,
            "title": exam.title,
            "scope": {
                "type": "single" if exam.scopes.count() == 1 else "multiple",
                "title": ", ".join(str(scope) for scope in exam.scopes.all()),
            },
            "exam_length": exam.exam_problems.count(),
            "created_at": exam.created_at,
            "submission": (
                {
                    "id": exam.submissions.first().id,
                    "score": exam.submissions.first().score,
                    "percentage": exam.submissions.first().percentage,
                    "status": exam.submissions.first().status,
                }
                if exam.submissions.exists()
                else None
            ),
        }
        for exam in exams
    ]
