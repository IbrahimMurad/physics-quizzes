from django.urls import path

from scope.views import (
    favorites,
    scope_browser,
    scope_list_api,
)

urlpatterns = [
    path("textbooks/", scope_browser, name="textbooks"),
    path("<int:id>/", scope_list_api, name="scope-api"),
    path("<slug:slug>/", scope_browser, name="scope-details"),
    path("favorites/", favorites, name="favorites"),
]
