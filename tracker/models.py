from datetime import timedelta

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from exam.models import Exam


class ExamTracker(models.Model):
    """This model tracks the exams created by users.
    And limits the number of exams created per week"""

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="exam_tracker"
    )
    max_exams_per_week = models.PositiveSmallIntegerField(default=3)
    week_start = models.DateField()
    next_week_start = models.DateField(blank=True, null=True)
    exams_count = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "exam_trackers"
        verbose_name = "Exam Tracker"
        verbose_name_plural = "Exam Trackers"
        ordering = ["user"]

    def __str__(self):
        return f"{self.user.username} - {self.week_start.strftime('%Y-%m-%d')} - {self.next_week_start.strftime('%Y-%m-%d')}"

    def save(self, *args, **kwargs):
        if not self.week_start:
            self.week_start = timezone.now().date()
        if not self.next_week_start:
            self.next_week_start = self.week_start + timedelta(days=7)
        if self.week_start > self.next_week_start:
            raise ValueError("Week start date must be less than week end date")
        if self.exams_count > self.max_exams_per_week:
            raise ValueError("Exams count cannot exceed max exams per week")
        super().save(*args, **kwargs)

    def can_create_exam(self):
        """Returns true if the current user has permission to create a new exam."""
        if timezone.now().date() > self.next_week_start:
            return True
        return self.exams_count < self.max_exams_per_week

    def update_exam_count(self):
        """Updates the exam count each time a user creates an exam."""

        # First check if the current week has ended, and reset the counter if it does
        if timezone.now().date() > self.next_week_start:
            self.exams_count = 0

        # Check if the user has reached the maximum number of exams per week
        if self.exams_count >= self.max_exams_per_week:
            raise ValidationError("Exams count cannot exceed max exams per week")

        # If this is the first time of the week, set the week start and end dates
        if self.exams_count == 0:
            self.week_start = timezone.now().date()
            self.next_week_start = self.week_start + timedelta(days=7)

        # Increment the exam count
        self.exams_count = Exam.objects.filter(
            created_by=self.user, created_at__gte=self.week_start
        ).count()
        self.save()
