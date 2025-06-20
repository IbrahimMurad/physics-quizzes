from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models

from problem.models import Choice, Problem


class Exam(models.Model):
    class ScopeChoice(models.TextChoices):
        LESSON = "Lesson", "Lesson"
        CHAPTER = "Chapter", "Chapter"
        UNIT = "Unit", "Unit"
        TEXTBOOK = "Textbook", "Textbook"

    title = models.CharField(max_length=256)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="exams", related_query_name="exam"
    )
    scope_type = models.CharField(
        max_length=10, choices=ScopeChoice.choices, default=ScopeChoice.LESSON
    )
    scope_id = models.PositiveIntegerField()
    problems = models.ManyToManyField(
        Problem, through="ExamProblem", related_name="exams", related_query_name="exam"
    )
    is_published = models.BooleanField(default=False)

    def __str__(self):
        return self.title


class ExamProblem(models.Model):
    exam = models.ForeignKey(
        Exam, on_delete=models.CASCADE, related_name="exam_problems"
    )
    problem = models.ForeignKey(
        Problem, on_delete=models.CASCADE, related_name="exam_problems"
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.exam.title} - {self.problem}"


class Submission(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    exam = models.ForeignKey(
        Exam, on_delete=models.CASCADE, related_name="submissions", null=True
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="submissions", null=True
    )
    score = models.FloatField(null=True)
    is_published = models.BooleanField(default=False)

    class Status(models.TextChoices):
        EXITED_UNEXPECTEDLY = "exited_unexpectedly", "Exited Unexpectedly"
        COMPLETED = "completed", "Completed"

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.EXITED_UNEXPECTEDLY
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.exam.title} - {self.score}"

    @property
    def percentage(self):
        if self.score:
            return self.score / self.exam.problems.count() * 100
        return None

    @property
    def wrong_answers(self):
        return self.exam.problems.count() - self.score


class Answer(models.Model):
    """
    Model to store the answers of a submission.
    It is linked to the Submission and Problem models.
    It ensures that there is only one answer per problem per submission (unique_answer).
    It also checks that the answer is related to the problem (check_answer_problem)
    and that the answered problem is in the exam problems (check_answer_exam).
    """

    problem = models.ForeignKey(Problem, on_delete=models.CASCADE)
    submission = models.ForeignKey(
        Submission,
        on_delete=models.CASCADE,
        related_name="answers",
        related_query_name="answer",
    )
    choice = models.ForeignKey(Choice, on_delete=models.CASCADE, null=True)

    class Meta:
        ordering = ["problem"]
        constraints = [
            models.UniqueConstraint(
                fields=["problem", "submission"], name="unique_answer"
            ),
        ]

    def clean(self):
        if self.choice.problem != self.problem:
            raise ValidationError(
                f"Choice {self.choice.body[:10]} does not belong to the problem {self.problem.body[:16]}."
            )
        if self.problem not in self.submission.exam.problems.all():
            raise ValidationError(
                f"Problem {self.problem.body[:16]} is not in this exam."
            )
        super().clean()
