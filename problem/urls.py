from django.urls import path
from problem.views import problem_list

urlpatterns = [
    path("", problem_list, name="problem-list"),
]