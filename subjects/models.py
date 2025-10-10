from django.db import models


class Subject(models.Model):
    """This model represents the subjects of a school or university
    eg. Math, Science, History, etc."""

    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(default="", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Subject"
        verbose_name_plural = "Subjects"
        ordering = ["name"]
        db_table = "subjects"
