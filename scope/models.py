from django.db import models


class TextBook(models.Model):
    """This model represent a physics textbook
    could be for first year, second year, or any other textbooks
    """

    name = models.CharField(max_length=64)

    def __str__(self):
        return self.name


class Unit(models.Model):
    """This model represnets the units of a textbook
    """

    textbook = models.ForeignKey(TextBook, on_delete=models.CASCADE, related_name="units", related_query_name="unit")
    title = models.CharField(max_length=64)
    caption = models.TextField()
    ccover = models.ImageField()
    in_scope_order = models.PositiveSmallIntegerField()

    class Meta:
        ordering = ["in_scope_order"]

    def __str__(self):
        return self.title


class Chapter(models.Model):
    """This model represnets the chapters of a unit
    """

    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name="chapters", related_query_name="chapter")
    title = models.CharField(max_length=64)
    caption = models.TextField()
    ccover = models.ImageField()
    in_scope_order = models.PositiveSmallIntegerField()

    class Meta:
        ordering = ["unit__in_scope_order", "in_scope_order"]

    def __str__(self):
        return self.title


class Lesson(models.Model):
    """This model represnets the lessons of a chapter
    """

    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name="lessons", related_query_name="lesson")
    title = models.CharField(max_length=64)
    caption = models.TextField()
    ccover = models.ImageField()
    in_scope_order = models.PositiveSmallIntegerField()

    class Meta:
        ordering = ["chapter__in_scope_order", "in_scope_order"]

    def __str__(self):
        return self.title

