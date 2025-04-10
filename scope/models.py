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
    caption = models.TextField(blank=True, default="")
    cover = models.ImageField(null=True, blank=True)
    in_scope_order = models.PositiveSmallIntegerField(default=1)

    class Meta:
        ordering = ["in_scope_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["textbook", "in_scope_order"],
                name="unique_unit_order_in_textbook"
            )
        ]

    def __str__(self):
        return self.title

    def save(self):
        self.full_clean()
        super().save()

class Chapter(models.Model):
    """This model represnets the chapters of a unit
    """

    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name="chapters", related_query_name="chapter")
    title = models.CharField(max_length=64)
    caption = models.TextField(blank=True, default="")
    cover = models.ImageField(null=True, blank=True)
    in_scope_order = models.PositiveSmallIntegerField(default=1)

    class Meta:
        ordering = ["unit__in_scope_order", "in_scope_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["unit", "in_scope_order"],
                name="unique_chapter_order_in_unit"
            )
        ]

    def __str__(self):
        return self.title

    def save(self):
        self.full_clean()
        super().save()

class Lesson(models.Model):
    """This model represnets the lessons of a chapter
    """

    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name="lessons", related_query_name="lesson")
    title = models.CharField(max_length=64)
    caption = models.TextField(blank=True, default="")
    cover = models.ImageField(null=True, blank=True)
    in_scope_order = models.PositiveSmallIntegerField(default=1)

    class Meta:
        ordering = ["chapter__in_scope_order", "in_scope_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["chapter", "in_scope_order"],
                name="unique_lesson_order_in_chapter"
            )
        ]

    def __str__(self):
        return self.title

    def save(self):
        self.full_clean()
        super().save()
