from django.core.exceptions import ValidationError
from django.db import models
from django.urls import reverse
from django.utils.text import slugify


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
        choices=LevelChoices, default=LevelChoices.TEXTBOOK
    )
    is_published = models.BooleanField(default=False)

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

        self.full_clean()
        super().save()

    def __str__(self):
        return f"{self.type}: {self.title}"

    def get_absolute_url(self):
        return reverse("scope-details", kwargs={"slug": self.slug})

    @property
    def url(self):
        return reverse("scope-details", kwargs={"slug": self.slug})

    @property
    def type(self):
        return self.LevelChoices(self.level).label

    @property
    def problems(self):
        """returns all the probelms under this scope"""
        from problem.models import Problem

        return Problem.objects.filter(
            models.Q(scope=self)
            | models.Q(scope__parent=self)
            | models.Q(scope__parent__parent=self)
            | models.Q(scope__parent__parent__parent=self),
            is_published=True,
        )
