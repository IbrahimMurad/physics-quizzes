from django.core.exceptions import ValidationError
from django.db import models
from django.urls import reverse
from django.utils.text import slugify

# from problem.models import Problem


class Scope(models.Model):
    """This model represents all the scope types,
    textbooks, units, chapters, and lessons
    It is a self-referencing model."""

    class LevelChoices(models.IntegerChoices):
        """choices for scope level"""

        TEXTBOOK = 0, "Textbook"
        UNIT = 1, "Unit"
        CHAPTER = 2, "Chapter"
        LESSON = 3, "Lesson"

    title = models.CharField(max_length=256)
    caption = models.TextField(blank=True, default="")
    cover = models.ImageField(null=True, blank=True)
    slug = models.SlugField(max_length=512, unique=True, editable=False)
    in_scope_order = models.PositiveSmallIntegerField(
        default=0
    )  # 0 is just for Textbooks since it is not sorted by this field and does not need sorting
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="children",
        related_query_name="child",
        db_index=True,
    )
    level = models.PositiveSmallIntegerField(
        choices=LevelChoices, default=LevelChoices.TEXTBOOK, editable=False
    )

    class Meta:
        ordering = ["in_scope_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["parent", "in_scope_order"],
                condition=models.Q(parent__isnull=False),
                name="unique_scope_order_in_parent",
            ),
            models.UniqueConstraint(
                fields=["parent", "title"], name="unique_title_of_same_parent"
            ),
        ]

    def clean(self) -> None:
        """Custom validation to prevent circular references"""
        super().clean()
        if self.parent:
            current = self.parent
            visited = set()
            while current:
                if current.pk == self.pk:
                    raise ValidationError("A scope can not be its own parent.")
                visited.add(current.pk)
                current = current.parent

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(f"{self.LevelChoices(self.level).label} {self.title}")
            self.slug = base_slug
            counter = 1
            old_slugs = Scope.objects.filter(slug__startswith=base_slug).values_list(
                "slug", flat=True
            )

            while self.slug in old_slugs:
                self.slug = f"{base_slug}-{counter}"
                counter += 1

        if self.parent:
            self.level = self.parent.level + 1
        else:
            self.level = self.LevelChoices.TEXTBOOK

        self.full_clean()
        super().save()

    def __str__(self):
        return f"{self.type}: {self.title}"

    # def get_absolute_url(self):
    #     return reverse("units", kwargs={"textbook_id": self.pk})

    # @property
    # def url(self):
    #     return reverse("units", kwargs={"textbook_id": self.pk})

    @property
    def type(self):
        return self.LevelChoices(self.level).label

    # @property
    # def problems(self):
    #     if self.level == 0:
    #         return Problem.objects.filter(scope__parent__parent__parent=self)
    #     elif self.level == 1:
    #         return Problem.objects.filter(scope__parent__parent=self)
    #     elif self.level == 2:
    #         return Problem.objects.filter(scope__parent=self)
    #     elif self.level == 3:
    #         return Problem.objects.filter(scope=self)
    #     else:
    #         raise ValueError("Unrecognized scope level.")


class TextBook(models.Model):
    """This model represent a physics textbook
    could be for first year, second year, or any other textbooks
    """

    title = models.CharField(max_length=256)
    caption = models.TextField(blank=True, default="")
    cover = models.ImageField(null=True, blank=True)

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse("units", kwargs={"textbook_id": self.pk})

    @property
    def url(self):
        return reverse("units", kwargs={"textbook_id": self.pk})

    @property
    def type(self):
        return "Textbook"

    @property
    def problems(self):
        """Get all problems of this textbook"""
        from problem.models import Problem

        return Problem.objects.filter(lesson__chapter__unit__textbook=self).values_list(
            "id", flat=True
        )


class Unit(models.Model):
    """This model represnets the units of a textbook"""

    textbook = models.ForeignKey(
        TextBook,
        on_delete=models.CASCADE,
        related_name="units",
        related_query_name="unit",
    )
    title = models.CharField(max_length=256)
    caption = models.TextField(blank=True, default="")
    cover = models.ImageField(null=True, blank=True)
    in_scope_order = models.PositiveSmallIntegerField(default=1)

    class Meta:
        ordering = ["in_scope_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["textbook", "in_scope_order"],
                name="unique_unit_order_in_textbook",
            )
        ]

    def __str__(self):
        return self.title

    def save(self):
        self.full_clean()
        super().save()

    def get_absolute_url(self):
        return reverse("chapters", kwargs={"unit_id": self.pk})

    @property
    def url(self):
        return reverse("chapters", kwargs={"unit_id": self.pk})

    @property
    def type(self):
        return "Unit"

    @property
    def problems(self):
        """Get all problems of this unit"""
        from problem.models import Problem

        return Problem.objects.filter(lesson__chapter__unit=self).values_list(
            "id", flat=True
        )


class Chapter(models.Model):
    """This model represnets the chapters of a unit"""

    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        related_name="chapters",
        related_query_name="chapter",
    )
    title = models.CharField(max_length=256)
    caption = models.TextField(blank=True, default="")
    cover = models.ImageField(null=True, blank=True)
    in_scope_order = models.PositiveSmallIntegerField(default=1)

    class Meta:
        ordering = ["unit__in_scope_order", "in_scope_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["unit", "in_scope_order"], name="unique_chapter_order_in_unit"
            )
        ]

    def __str__(self):
        return self.title

    def save(self):
        self.full_clean()
        super().save()

    def get_absolute_url(self):
        return reverse("lessons", kwargs={"chapter_id": self.pk})

    @property
    def url(self):
        return reverse("lessons", kwargs={"chapter_id": self.pk})

    @property
    def type(self):
        return "Chapter"

    @property
    def problems(self):
        """Get all problems of this chapter"""
        from problem.models import Problem

        return Problem.objects.filter(lesson__chapter=self).values_list("id", flat=True)


class Lesson(models.Model):
    """This model represnets the lessons of a chapter"""

    chapter = models.ForeignKey(
        Chapter,
        on_delete=models.CASCADE,
        related_name="lessons",
        related_query_name="lesson",
    )
    title = models.CharField(max_length=256)
    caption = models.TextField(blank=True, default="")
    cover = models.ImageField(null=True, blank=True)
    in_scope_order = models.PositiveSmallIntegerField(default=1)

    class Meta:
        ordering = ["chapter__in_scope_order", "in_scope_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["chapter", "in_scope_order"],
                name="unique_lesson_order_in_chapter",
            )
        ]

    def __str__(self):
        return self.title

    def save(self):
        self.full_clean()
        super().save()

    @property
    def type(self):
        return "Lesson"

    @property
    def problems(self):
        """Get all problems of this lesson"""
        from problem.models import Problem

        return Problem.objects.filter(lesson=self).values_list("id", flat=True)
