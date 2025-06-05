from django.shortcuts import render, redirect, get_object_or_404
from .models import Exam, Submission, Answer, ExamProblem
from problem.models import Problem, Choice
from scope.models import TextBook, Unit, Chapter, Lesson
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
import random
from django.contrib import messages
from exam.utils import reload
from django.urls import reverse


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


@require_http_methods(["POST"])
def exam_create(request):

    if request.user.is_anonymous:
        messages.error(request, "You must be logged in to create an exam")
        redirect_url = f"{reverse('login')}?next={request.META.get('HTTP_REFERER', '/')}"
        return redirect(redirect_url)

    scope_type = request.POST.get("scope_type")
    scope_id = request.POST.get("scope_id")

    print(scope_type, scope_id)

    if scope_type not in ["Lesson", "Chapter", "Unit", "Textbook"]:
        messages.error(request, "Invalid scope type")
        return reload(request)

    try:
        scope = scope_types[scope_type].objects.get(id=scope_id)
    except scope_types[scope_type].DoesNotExist:
        messages.error(request, "Scope not found")
        return reload(request)


    if scope.problems.count() < scope_problem_number[scope_type]:
        messages.warning(request, "Unfortunatly, there are no enough problems for this scope")
        return redirect(request.META.get("HTTP_REFERER", "/"))

    problems = list(scope.problems)
    random.shuffle(problems)

    exam = Exam.objects.create(
        title=f"Exam for {scope_type}: {scope.title} - created by {request.user.username}",
        created_by=request.user,
        scope_type=scope_type,
        scope_id=scope_id,
    )

    for order, problem_id in enumerate(problems[: scope_problem_number[scope_type]]):
        problem = Problem.objects.get(id=problem_id)
        ExamProblem.objects.create(exam=exam, problem=problem, order=(order + 1))

    return redirect("exam", exam_id=exam.id)


@login_required
@require_http_methods(["GET"])
def exam_view(request, exam_id):
    exam = get_object_or_404(Exam, id=exam_id)

    if exam.created_by != request.user and not exam.is_published:
        messages.error(request, "You do not have permission to view this exam")
        return reload(request)
    return render(request, "exam/exam.html", {"exam": exam})


@login_required
@require_http_methods(["POST", "GET"])
def submit_exam(request, exam_id):
    exam = get_object_or_404(Exam, id=exam_id)

    if exam.created_by != request.user and not exam.is_published:
        messages.error(request, "You do not have permission to view this exam")
        return reload(request)

    exam_problems = exam.exam_problems.all().prefetch_related("problem__choices")

    submission = Submission.objects.create(
        user=request.user,
        exam=exam,
    )

    if request.method == "POST":
        score = 0
        for exam_problem in exam_problems:
            answer = request.POST.get(f"problem_{exam_problem.order}")
            if answer:
                choice = Choice.objects.get(id=answer)
                Answer.objects.create(
                    submission=submission,
                    problem=exam_problem.problem,
                    choice=choice,
                )
                if choice.is_correct:
                    score += 1
        submission.score = score
        submission.save()

        return redirect("exam-result", submission_id=submission.id)

    return render(
        request, "exam/submit_exam.html", {"exam": exam, "exam_problems": exam_problems}
    )


@require_http_methods(["GET"])
@login_required
def exam_result(request, submission_id):
    submission = get_object_or_404(Submission, id=submission_id)

    if submission.user != request.user:
        messages.error(request, "You do not have permission to view this result")
        return reload(request)

    answers = submission.answers.values_list("choice", flat=True)

    context = {
        "score": submission.score,
        "wrong_answers": submission.wrong_answers,
        "percentage": submission.percentage,
        "exam_length": submission.exam.problems.count,
        "exam_title": submission.exam.title,
        "problems": [
            {
                "id": problem.id,
                "body": problem.body,
                "choices": [
                    {
                        "id": choice.id,
                        "body": choice.body,
                        "is_correct": choice.is_correct,
                        "checked": choice.id in answers,
                    }
                    for choice in problem.choices.all()
                ],
                "answered_correctly": Choice.objects.get(answer__submission=submission, answer__problem=problem).is_correct,
            }
            for problem in submission.exam.problems.all()
        ],
    }

    return render(
        request,
        "exam/exam_result.html",
        context=context,
    )
