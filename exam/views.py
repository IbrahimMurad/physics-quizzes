import random

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_http_methods

from exam.utils import get_exams, reload, scope_problem_number
from problem.models import Problem
from scope.models import Scope

from .models import Exam, ExamProblem, Submission
from .service import correct_exam


@login_required()
@require_http_methods(["POST"])
def exam_create(request):
    # Get form data
    exam_title = request.POST.get("exam_title")
    exam_type = request.POST.get("exam-type", "single_scope")
    number_of_problems = request.POST.get("number_of_problems")
    
    # Handle scope_ids consistently for both single and multiple scope modes
    scope_ids = request.POST.getlist("scope_ids")
    # Remove duplicates and empty strings
    scope_ids = list(filter(None, set(scope_ids)))
    
    # Validate that we have at least one scope
    if not scope_ids:
        messages.error(request, "Please select at least one scope for the exam")
        return reload(request)
    
    # Additional validation for multiple scope exams
    if exam_type == "multi_scope":
        # Limit the number of scopes in multiple-scopes exams
        MAX_SCOPES = 10  # You can adjust this limit as needed
        if len(scope_ids) > MAX_SCOPES:
            messages.error(request, f"Too many scopes selected. Maximum allowed is {MAX_SCOPES}")
            return reload(request)
    
    # Validate that all provided ids are legitimate scope IDs
    try:
        # Convert string IDs to integers and validate they exist
        valid_scope_ids = []
        for scope_id in scope_ids:
            try:
                valid_scope_ids.append(int(scope_id))
            except (ValueError, TypeError):
                messages.error(request, f"Invalid scope ID: {scope_id}")
                return reload(request)
        
        # Check that all scopes exist in the database
        scopes = Scope.objects.filter(id__in=valid_scope_ids)
        
        if len(scopes) != len(valid_scope_ids):
            found_ids = set(scopes.values_list('id', flat=True))
            missing_ids = set(valid_scope_ids) - found_ids
            messages.error(request, f"Some scopes were not found: {', '.join(map(str, missing_ids))}")
            return reload(request)
            
    except Exception as e:
        messages.error(request, "Error validating scope IDs")
        return reload(request)
    
    # Collect all problems from the selected scopes
    problems = []
    for scope in scopes:
        problems.extend(list(scope.problems))
    
    # Remove duplicate problems (in case of overlapping scopes)
    unique_problems = list({problem.id: problem for problem in problems}.values())
    
    # Determine number of problems for the exam
    if exam_type == "single_scope":
        # For single scope, use predefined number based on scope type
        target_problems = scope_problem_number.get(scopes[0].type, len(unique_problems))
    else:
        # For multiple scopes, use provided number or default
        if number_of_problems:
            try:
                target_problems = int(number_of_problems)
            except (ValueError, TypeError):
                target_problems = len(unique_problems)
        else:
            target_problems = len(unique_problems)
    
    # Validate we have enough problems
    if len(unique_problems) < target_problems:
        if len(unique_problems) == 0:
            messages.error(request, "No problems are available for the selected scope(s)")
        else:
            messages.warning(
                request,
                f"Unfortunately, there are not enough problems for this selection. "
                f"Only {len(unique_problems)} problem{'s' if len(unique_problems) != 1 else ''} "
                f"{'are' if len(unique_problems) != 1 else 'is'} available."
            )
        return redirect(request.META.get("HTTP_REFERER", "/"))
    
    # Randomly shuffle problems to ensure variety
    random.shuffle(unique_problems)
    
    # Generate default title if not provided
    if not exam_title or not exam_title.strip():
        if exam_type == "single_scope":
            exam_title = f"Exam for {scopes[0].type}: {scopes[0].title} - created by {request.user.username}"
        else:
            scope_names = ", ".join([f"{scope.type}: {scope.title}" for scope in scopes[:2]])
            if len(scopes) > 2:
                scope_names += f" and {len(scopes) - 2} more"
            exam_title = f"Multi-scope exam ({scope_names}) - created by {request.user.username}"
    
    # Create the exam
    try:
        exam = Exam.objects.create(
            title=exam_title.strip(),
            created_by=request.user,
        )
        
        # Associate scopes with the exam
        exam.scopes.set(scopes)
        
        # Create exam problems with proper ordering
        exam_problems = []
        for order, problem in enumerate(unique_problems[:target_problems], start=1):
            exam_problem = ExamProblem(exam=exam, problem=problem, order=order)
            exam_problems.append(exam_problem)
        
        # Bulk create for better performance
        ExamProblem.objects.bulk_create(exam_problems)
        
        # Success message
        problem_count = len(exam_problems)
        scope_count = len(scopes)
        messages.success(
            request, 
            f"Exam created successfully with {problem_count} problem{'s' if problem_count != 1 else ''} "
            f"from {scope_count} scope{'s' if scope_count != 1 else ''}!"
        )
        
        return redirect("exam", exam_id=exam.id)
        
    except Exception as e:
        messages.error(request, "An error occurred while creating the exam. Please try again.")
        return reload(request)


@login_required()
@require_http_methods(["GET"])
def exam_view(request, exam_id):
    exam = get_object_or_404(Exam, id=exam_id)

    if exam.created_by != request.user and not exam.is_published:
        messages.error(request, "You do not have permission to view this exam")
        return reload(request)
    return render(request, "exam/exam.html", {"exam": exam})


@login_required()
@require_http_methods(["POST", "GET"])
def submit_exam(request, exam_id):
    exam = Exam.objects.prefetch_related(
        "exam_problems__problem", "exam_problems__problem__choices"
    ).get(id=exam_id)

    if exam.created_by != request.user and not exam.is_published:
        messages.error(request, "You do not have permission to view this exam")
        return reload(request)

    exam_problems = exam.exam_problems.all()

    if exam.submissions.filter(user=request.user).exists():
        # this handles the second visit to the page
        # so it gets the submission first
        submission = exam.submissions.get(user=request.user)

        # If the method is POST correct the exam
        if request.method == "POST":
            if submission.status == Submission.Status.COMPLETED:
                messages.error(request, "You have already completed this exam")
                return reload(request)
            correct_exam(exam_problems, submission, request.POST)
            return redirect("exam-result", submission_id=submission.id)

        # if the method is GET, redirect the user to the corrected page of this exam
        # since it has only one trial of solving the exam
        else:
            return redirect("exam-result", submission_id=submission.id)
    else:
        # this handles the first visit to the page
        # so it creates a submission for this user and this exam
        submission = Submission.objects.create(
            user=request.user,
            exam=exam,
        )
        return render(
            request,
            "exam/submit_exam.html",
            {"exam": exam, "exam_problems": exam_problems},
        )


@login_required()
@require_http_methods(["GET"])
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

        problem_data.append({
            "id": problem.id,
            "body": problem.body,
            "figure": problem.figure,
            "choices": choices,
            "answered_correctly": problem_correct_map.get(problem.id, False),
        })

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


@login_required()
@require_http_methods(["GET"])
def create_custom_exam(request):
    """This view renders the create exam page, but does not handle the creation of the exam"""
    context = {
        "textbooks": Scope.objects.filter(level=0).prefetch_related(
            "children__children__children"
        ),
    }
    return render(request, "exam/create_exam.html", context)


@login_required()
@require_http_methods(["GET"])
def exam_list(request):
    solved = request.GET.get("solved", False)
    return render(
        request,
        "exam/exam_list.html",
        {"exams": get_exams(request=request, solved=solved)},
    )        return reload(request)
    
    # Additional validation for multiple scope exams
    if exam_type == "multi_scope":
        # Limit the number of scopes in multiple-scopes exams
        MAX_SCOPES = 10  # You can adjust this limit as needed
        if len(scope_ids) > MAX_SCOPES:
            messages.error(request, f"Too many scopes selected. Maximum allowed is {MAX_SCOPES}")
            return reload(request)
    
    # Validate that all provided ids are legitimate scope IDs
    try:
        # Convert string IDs to integers and validate they exist
        valid_scope_ids = []
        for scope_id in scope_ids:
            try:
                valid_scope_ids.append(int(scope_id))
            except (ValueError, TypeError):
                messages.error(request, f"Invalid scope ID: {scope_id}")
                return reload(request)
        
        # Check that all scopes exist in the database
        scopes = Scope.objects.filter(id__in=valid_scope_ids)
        
        if len(scopes) != len(valid_scope_ids):
            found_ids = set(scopes.values_list('id', flat=True))
            missing_ids = set(valid_scope_ids) - found_ids
            messages.error(request, f"Some scopes were not found: {', '.join(map(str, missing_ids))}")
            return reload(request)
            
    except Exception as e:
        messages.error(request, "Error validating scope IDs")
        return reload(request)
    
    # Collect all problems from the selected scopes
    problems = []
    for scope in scopes:
        problems.extend(list(scope.problems))
    
    # Remove duplicate problems (in case of overlapping scopes)
    unique_problems = list({problem.id: problem for problem in problems}.values())
    
    # Determine number of problems for the exam
    if exam_type == "single_scope":
        # For single scope, use predefined number based on scope type
        target_problems = scope_problem_number.get(scopes[0].type, len(unique_problems))
    else:
        # For multiple scopes, use provided number or default
        if number_of_problems:
            try:
                target_problems = int(number_of_problems)
            except (ValueError, TypeError):
                target_problems = len(unique_problems)
        else:
            target_problems = len(unique_problems)
    
    # Validate we have enough problems
    if len(unique_problems) < target_problems:
        if len(unique_problems) == 0:
            messages.error(request, "No problems are available for the selected scope(s)")
        else:
            messages.warning(
                request,
                f"Unfortunately, there are not enough problems for this selection. "
                f"Only {len(unique_problems)} problem{'s' if len(unique_problems) != 1 else ''} "
                f"{'are' if len(unique_problems) != 1 else 'is'} available."
            )
        return redirect(request.META.get("HTTP_REFERER", "/"))
    
    # Randomly shuffle problems to ensure variety
    random.shuffle(unique_problems)
    
    # Generate default title if not provided
    if not exam_title or not exam_title.strip():
        if exam_type == "single_scope":
            exam_title = f"Exam for {scopes[0].type}: {scopes[0].title} - created by {request.user.username}"
        else:
            scope_names = ", ".join([f"{scope.type}: {scope.title}" for scope in scopes[:2]])
            if len(scopes) > 2:
                scope_names += f" and {len(scopes) - 2} more"
            exam_title = f"Multi-scope exam ({scope_names}) - created by {request.user.username}"
    
    # Create the exam
    try:
        exam = Exam.objects.create(
            title=exam_title.strip(),
            created_by=request.user,
        )
        
        # Associate scopes with the exam
        exam.scopes.set(scopes)
        
        # Create exam problems with proper ordering
        exam_problems = []
        for order, problem in enumerate(unique_problems[:target_problems], start=1):
            exam_problem = ExamProblem(exam=exam, problem=problem, order=order)
            exam_problems.append(exam_problem)
        
        # Bulk create for better performance
        ExamProblem.objects.bulk_create(exam_problems)
        
        # Success message
        problem_count = len(exam_problems)
        scope_count = len(scopes)
        messages.success(
            request, 
            f"Exam created successfully with {problem_count} problem{'s' if problem_count != 1 else ''} "
            f"from {scope_count} scope{'s' if scope_count != 1 else ''}!"
        )
        
        return redirect("exam", exam_id=exam.id)
        
    except Exception as e:
        messages.error(request, "An error occurred while creating the exam. Please try again.")
        return reload(request)


@login_required()
@require_http_methods(["GET"])
def exam_view(request, exam_id):
    exam = get_object_or_404(Exam, id=exam_id)

    if exam.created_by != request.user and not exam.is_published:
        messages.error(request, "You do not have permission to view this exam")
        return reload(request)
    return render(request, "exam/exam.html", {"exam": exam})


@login_required()
@require_http_methods(["POST", "GET"])
def submit_exam(request, exam_id):
    exam = Exam.objects.prefetch_related(
        "exam_problems__problem", "exam_problems__problem__choices"
    ).get(id=exam_id)

    if exam.created_by != request.user and not exam.is_published:
        messages.error(request, "You do not have permission to view this exam")
        return reload(request)

    exam_problems = exam.exam_problems.all()

    if exam.submissions.filter(user=request.user).exists():
        # this handles the second visit to the page
        # so it gets the submission first
        submission = exam.submissions.get(user=request.user)

        # If the method is POST correct the exam
        if request.method == "POST":
            if submission.status == Submission.Status.COMPLETED:
                messages.error(request, "You have already completed this exam")
                return reload(request)
            correct_exam(exam_problems, submission, request.POST)
            return redirect("exam-result", submission_id=submission.id)

        # if the method is GET, redirect the user to the corrected page of this exam
        # since it has only one trial of solving the exam
        else:
            return redirect("exam-result", submission_id=submission.id)
    else:
        # this handles the first visit to the page
        # so it creates a submission for this user and this exam
        submission = Submission.objects.create(
            user=request.user,
            exam=exam,
        )
        return render(
            request,
            "exam/submit_exam.html",
            {"exam": exam, "exam_problems": exam_problems},
        )


@login_required()
@require_http_methods(["GET"])
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

        problem_data.append({
            "id": problem.id,
            "body": problem.body,
            "figure": problem.figure,
            "choices": choices,
            "answered_correctly": problem_correct_map.get(problem.id, False),
        })

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


@login_required()
@require_http_methods(["GET"])
def create_custom_exam(request):
    """This view renders the create exam page, but does not handle the creation of the exam"""
    context = {
        "textbooks": Scope.objects.filter(level=0).prefetch_related(
            "children__children__children"
        ),
    }
    return render(request, "exam/create_exam.html", context)


@login_required()
@require_http_methods(["GET"])
def exam_list(request):
    solved = request.GET.get("solved", False)
    return render(
        request,
        "exam/exam_list.html",
        {"exams": get_exams(request=request, solved=solved)},
    )    if not scopes:
        messages.error(request, "Scope not found")
        return reload(request)

    problems = []

    for scope in scopes:
        problems.extend(list(scope.problems))

    if exam_type == "single_scope":
        number_of_problems = scope_problem_number[scopes[0].type]
    else:
        number_of_problems = int(number_of_problems)

    if len(problems) < number_of_problems:
        messages.warning(
            request,
            f"Unfortunatly, there are no enough problems for this scope.\n Only {len(problems)} are available.",
        )
        return redirect(request.META.get("HTTP_REFERER", "/"))

    random.shuffle(problems)

    exam = Exam.objects.create(
        title=exam_title
        or f"Exam for {scopes[0].type}: {scopes[0].title} - created by {request.user.username}",
        created_by=request.user,
    )
    exam.scopes.set(scopes)
    exam.save()

    for order, problem in enumerate(problems[:number_of_problems]):
        ExamProblem.objects.create(exam=exam, problem=problem, order=(order + 1))

    return redirect("exam", exam_id=exam.id)


@login_required()
@require_http_methods(["GET"])
def exam_view(request, exam_id):
    exam = get_object_or_404(Exam, id=exam_id)

    if exam.created_by != request.user and not exam.is_published:
        messages.error(request, "You do not have permission to view this exam")
        return reload(request)
    return render(request, "exam/exam.html", {"exam": exam})


@login_required()
@require_http_methods(["POST", "GET"])
def submit_exam(request, exam_id):
    exam = Exam.objects.prefetch_related(
        "exam_problems__problem", "exam_problems__problem__choices"
    ).get(id=exam_id)

    if exam.created_by != request.user and not exam.is_published:
        messages.error(request, "You do not have permission to view this exam")
        return reload(request)

    exam_problems = exam.exam_problems.all()

    if exam.submissions.filter(user=request.user).exists():
        # this handles the second visit to the page
        # so it gets the submission first
        submission = exam.submissions.get(user=request.user)

        # If the method is POST correct the exam
        if request.method == "POST":
            if submission.status == Submission.Status.COMPLETED:
                messages.error(request, "You have already completed this exam")
                return reload(request)
            correct_exam(exam_problems, submission, request.POST)
            return redirect("exam-result", submission_id=submission.id)

        # if the method is GET, redirect the user to the corrected page of this exam
        # since it has only one trial of solving the exam
        else:
            return redirect("exam-result", submission_id=submission.id)
    else:
        # this handles the first visit to the page
        # so it creates a submission for this user and this exam
        submission = Submission.objects.create(
            user=request.user,
            exam=exam,
        )
        return render(
            request,
            "exam/submit_exam.html",
            {"exam": exam, "exam_problems": exam_problems},
        )


@login_required()
@require_http_methods(["GET"])
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

        problem_data.append({
            "id": problem.id,
            "body": problem.body,
            "figure": problem.figure,
            "choices": choices,
            "answered_correctly": problem_correct_map.get(problem.id, False),
        })

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


@login_required()
@require_http_methods(["GET"])
def create_custom_exam(request):
    """This view renders the create exam page, but does not handle the creation of the exam"""
    context = {
        "textbooks": Scope.objects.filter(level=0).prefetch_related(
            "children__children__children"
        ),
    }
    return render(request, "exam/create_exam.html", context)


@login_required()
@require_http_methods(["GET"])
def exam_list(request):
    solved = request.GET.get("solved", False)
    return render(
        request,
        "exam/exam_list.html",
        {"exams": get_exams(request=request, solved=solved)},
    )
