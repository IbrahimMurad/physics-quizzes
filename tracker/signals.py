from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

from exam.models import Exam

from .models import ExamTracker


@receiver(post_save, sender=User)
def create_exam_tracker(sender, instance, created, **kwargs):
    if created:
        ExamTracker.objects.create(user=instance)


@receiver(post_save, sender=Exam)
def update_exam_counter(sender, instance, created, **kwargs):
    if created:
        instance.created_by.exam_tracker.update_exam_count()
