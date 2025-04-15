from django.shortcuts import render, redirect, get_object_or_404
from .models import Exam, Submission, Answer, ExamProblem
from problem.models import Problem, Choice
from scope.models import TextBook, Unit, Chapter, Lesson
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
import random


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


@login_required
@require_http_methods(["POST"])
def create_exam(request):
    scope_type = request.POST.get("scope_type")
    scope_id = request.POST.get("scope_id")

    if scope_type not in ["Lesson", "Chapter", "Unit", "Textbook"]:
        return JsonResponse({"error": "Invalid scope type"}, status=400)

    try:
        scope = scope_types[scope_type].objects.get(id=scope_id)
    except scope_types[scope_type].DoesNotExist:
        return JsonResponse({"error": "Scope not found"}, status=404)

    problems = Problem.objects.filter(
        scope_type=scope_type, scope_id=scope_id
    ).values_list("id", flat=True)

    if not problems:
        return JsonResponse({"error": "No problems found for this scope"}, status=404)

    exam = Exam.objects.create(
        title=f"Exam for {scope_type}: {scope.title} - created by {request.user.username}",
        created_by=request.user,
        scope_type=scope_type,
        scope_id=scope_id,
    )

    exam_problems = random.shuffle(list(problems))[: scope_problem_number[scope_type]]

    for order, problem_id in enumerate(exam_problems):
        problem = Problem.objects.get(id=problem_id)
        ExamProblem.objects.create(exam=exam, problem=problem, order=order)

    return redirect("exam", exam_id=exam.id)


@login_required
@require_http_methods(["GET"])
def exam_view(request, exam_id):
    exam = get_object_or_404(Exam, id=exam_id)

    if exam.created_by != request.user and not exam.is_published:
        return JsonResponse(
            {"error": "You do not have permission to view this exam"}, status=403
        )
    return render(request, "exam/exam.html", {"exam": exam})


@login_required
@require_http_methods(["POST", "GET"])
def submit_exam(request, exam_id):
    exam = get_object_or_404(Exam, id=exam_id)

    if exam.created_by != request.user and not exam.is_published:
        return JsonResponse(
            {"error": "You do not have permission to view this exam"}, status=403
        )

    problems = exam.problems.all().prefetch_related("choices")

    submission = Submission.objects.create(
        user=request.user,
        exam=exam,
    )

    if request.method == "POST":
        score = 0
        for problem in problems:
            answer = request.POST.get(f"answer_{problem.id}")
            if answer:
                choice = Choice.objects.get(id=answer)
                Answer.objects.create(
                    submission=submission,
                    problem=problem,
                    choice=Choice.objects.get(id=answer),
                )
                if choice.is_correct:
                    score += 1
        submission.score = score
        submission.save()

        return redirect("exam-result", submission_id=submission.id)

    return render(request, "exam/submit_exam.html", {"exam": exam})
