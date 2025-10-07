from django.db import models

from scope.models import Scope
from django.core.validators import FileExtensionValidator


class Problem(models.Model):
    """This model represents the problems of a lesson"""

    class Difficulty(models.IntegerChoices):
        EASY = 1, "Easy"
        MIDIUM = 2, "Medium"
        HARD = 3, "Hard"
        EXTRA = 4, "Extra hard"

    scope = models.ForeignKey(
        Scope,
        on_delete=models.CASCADE,
        related_name="problems_set",
        related_query_name="problem",
        limit_choices_to={"level": 3},
    )
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    figure = models.FileField(upload_to="problems/", null=True, blank=True, validators=[FileExtensionValidator(allowed_extensions=['svg', 'png', 'jpg'])])
    difficulty = models.PositiveSmallIntegerField(
        choices=Difficulty, default=Difficulty.EASY
    )
    is_published = models.BooleanField(default=False)

    class Meta:
        ordering = ["difficulty", "created_at"]

    def __str__(self):
        return self.body[:24]


class Choice(models.Model):
    """This models represents the choces of a problem"""

    problem = models.ForeignKey(
        Problem,
        on_delete=models.CASCADE,
        related_name="choices",
        related_query_name="choice",
    )
    body = models.CharField(max_length=256, null=True, blank=True)
    figure = models.FileField(upload_to="choices/", null=True, blank=True, validators=[FileExtensionValidator(allowed_extensions=['svg', 'png', 'jpg'])])
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return self.body or self.figure.name
