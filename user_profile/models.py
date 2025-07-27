from django.contrib.auth.models import User
from django.db import models

from scope.models import Scope


class Profile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile",
        related_query_name="profile",
    )
    favorites = models.ManyToManyField(Scope)

    # profile_picture = models.ImageField(
    #     upload_to="profile_pictures/", blank=True, null=True
    # )

    def __str__(self):
        return self.user.username
