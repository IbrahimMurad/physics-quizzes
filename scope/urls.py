from django.urls import path

from scope.views import (
    scope_browser,
    scope_list_api,
)

urlpatterns = [
    path("textbooks/", scope_browser, name="textbooks"),
    path("s/<slug:slug>", scope_browser, name="scope-details"),
    path("scope/<int:id>/", scope_list_api, name="scope-api"),
]
