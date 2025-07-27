from django.shortcuts import redirect

from exam.models import Exam, Submission

scope_problem_number = {
    "Lesson": 10,
    "Chapter": 25,
    "Unit": 40,
    "Textbook": 50,
}


def reload(request):
    """Reloads the current page"""
    return redirect(request.META.get("HTTP_REFERER", "/"))


def get_exams(request, limit=None, solved=False) -> dict:
    """returns the context for exams list"""

    exams = (
        Exam.objects.filter(created_by=request.user)
        .select_related("scope")
        .prefetch_related("submissions", "exam_problems")
    )
    if limit:
        exams = exams[:limit]
    if solved:
        exams = exams.filter(submissions__user=request.user)
    context = {
        "exams": [
            {
                "id": exam.id,
                "title": exam.title,
                "scope": {
                    "type": exam.scope.type,
                    "title": exam.scope.title,
                },
                "exam_length": scope_problem_number[str(exam.scope.type)],
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
        ],
    }

    print(context)

    return context
