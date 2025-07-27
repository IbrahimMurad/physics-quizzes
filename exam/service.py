from exam.models import Answer, Submission


def correct_exam(exam_problems, submission, submitted_answers):
    score = 0

    all_choices = {
        choice.id: choice
        for exam_problem in exam_problems
        for choice in exam_problem.problem.choices.all()
    }

    answers = []

    for exam_problem in exam_problems:
        choice_id = submitted_answers.get(f"problem_{exam_problem.order}")

        if choice_id:
            try:
                choice_id = int(choice_id)
                choice = all_choices.get(choice_id)
                if choice is not None and choice.problem_id == exam_problem.problem.id:
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
