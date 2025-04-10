from django.db import models
from scope.models import Lesson

class Problem(models.Model):
    """This model represents the problems of a lesson"""

    class Difficulty(models.IntegerChoices):
        EASY = 1, "Easy"
        MIDIUM = 2, "Medium"
        HARD = 3, "Hard"
        EXTRA = 4, "Extra hard"

    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="lessons", related_query_name="problem")
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    figure = models.ImageField(upload_to="problems/", null=True, blank=True)
    difficulty = models.PositiveSmallIntegerField(choices=Difficulty, default=Difficulty.EASY)

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
        related_query_name="choice"
    )
    body = models.CharField(max_length=256, null=True, blank=True)
    figure = models.ImageField(upload_to="choices/", null=True, blank=True)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return self.body or self.figure.name

