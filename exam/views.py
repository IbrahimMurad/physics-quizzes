import random

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.views.decorators.http import require_http_methods

from exam.utils import get_submissions, reload, scope_problem_number
from problem.models import Problem
from scope.models import Scope

from .models import Answer, Exam, ExamProblem, Submission


@require_http_methods(["POST"])
def exam_create(request):
    if request.user.is_anonymous:
        messages.error(request, "You must be logged in to create an exam")
        redirect_url = (
            f"{reverse('login')}?next={request.META.get('HTTP_REFERER', '/')}"
        )
        return redirect(redirect_url)

    scope_id = request.POST.get("scope")
    exam_title = request.POST.get("exam_title")

    try:
        scope = Scope.objects.get(id=scope_id)
    except Scope.DoesNotExist:
        messages.error(request, "Scope not found")
        return reload(request)

    problems = list(scope.problems)
    if len(problems) < scope_problem_number[scope.type]:
        messages.warning(
            request, "Unfortunatly, there are no enough problems for this scope"
        )
        return redirect(request.META.get("HTTP_REFERER", "/"))

    random.shuffle(problems)

    exam = Exam.objects.create(
        title=exam_title
        or f"Exam for {scope.type}: {scope.title} - created by {request.user.username}",
        created_by=request.user,
        scope=scope,
    )

    for order, problem in enumerate(problems[: scope_problem_number[scope.type]]):
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
    exam = Exam.objects.prefetch_related(
        "exam_problems__problem", "exam_problems__problem__choices"
    ).get(id=exam_id)

    if exam.created_by != request.user and not exam.is_published:
        messages.error(request, "You do not have permission to view this exam")
        return reload(request)

    exam_problems = list(exam.exam_problems.all())

    submission = Submission.objects.create(
        user=request.user,
        exam=exam,
    )

    if request.method == "POST":
        score = 0

        all_choices = {
            choice.id: choice
            for ep in exam_problems
            for choice in ep.problem.choices.all()
        }

        answers = []

        for exam_problem in exam_problems:
            choice_id = request.POST.get(f"problem_{exam_problem.order}")

            if choice_id:
                try:
                    choice_id = int(choice_id)
                    choice = all_choices.get(choice_id)
                    if (
                        choice is not None
                        and choice.problem_id == exam_problem.problem.id
                    ):
                        answers.append(
                            Answer(
                                submission=submission,
                                problem=exam_problem.problem,
                                choice=choice,
                            )
                        )
                        if choice.is_correct:
                            score += 1
                except (ValueError, TypeError):
                    pass  # silently ignore invalid input

        # Bulk insert answers
        Answer.objects.bulk_create(answers)

        submission.score = score
        submission.status = Submission.Status.COMPLETED
        submission.save()
        return redirect("exam-result", submission_id=submission.id)

    return render(
        request, "exam/submit_exam.html", {"exam": exam, "exam_problems": exam_problems}
    )


@require_http_methods(["GET"])
@login_required
def exam_result(request, submission_id):
    submission = (
        Submission.objects.select_related("exam")
        .prefetch_related(
            "answers__choice",
            "answers__problem",
            Prefetch(
                "exam__problems", queryset=Problem.objects.prefetch_related("choices")
            ),
        )
        .get(id=submission_id)
    )

    if submission.user != request.user:
        messages.error(request, "You do not have permission to view this result")
        return reload(request)

    problems = list(submission.exam.problems.all())

    if submission.status == Submission.Status.EXITED_UNEXPECTEDLY:
        messages.error(
            request, "You exited this exam unexpectedly, so there is no results."
        )
        return render(
            request,
            "exam/exam_result.html",
            {
                "score": "-",
                "wrong_answers": "-",
                "percentage": "-",
                "exam_length": len(problems),
                "exam_title": submission.exam.title,
            },
        )

    answers = submission.answers.all()

    chosen_choices_ids = set(a.choice_id for a in answers if a.choice_id)
    problem_correct_map = {
        a.problem_id: a.choice.is_correct for a in answers if a.choice_id
    }

    problem_data = []

    for problem in problems:
        choices = [
            {
                "id": choice.id,
                "body": choice.body,
                "figure": choice.figure,
                "is_correct": choice.is_correct,
                "checked": choice.id in chosen_choices_ids,
            }
            for choice in problem.choices.all()
        ]

        problem_data.append(
            {
                "id": problem.id,
                "body": problem.body,
                "figure": problem.figure,
                "choices": choices,
                "answered_correctly": problem_correct_map.get(problem.id, False),
            }
        )

    context = {
        "score": submission.score,
        "wrong_answers": submission.wrong_answers,
        "percentage": submission.percentage,
        "exam_length": len(problems),
        "exam_title": submission.exam.title,
        "problems": problem_data,
    }

    return render(
        request,
        "exam/exam_result.html",
        context=context,
    )


@require_http_methods(["GET"])
@login_required
def create_custom_exam(request):
    context = {"textbooks": Scope.objects.filter(level=0)}
    return render(request, "exam/create_exam.html", context)


@require_http_methods(["GET"])
@login_required
def exam_list(request):
    context = get_submissions(request=request)
    return render(request, "exam/exam_list.html", context)
