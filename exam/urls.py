from django.urls import path

from exam.views import (
    create_custom_exam,
    exam_create,
    exam_list,
    exam_result,
    exam_view,
    submit_exam,
)

urlpatterns = [
    path("", exam_list, name="exam-list"),
    path("<int:exam_id>/", exam_view, name="exam"),
    path("create/", exam_create, name="exam-create"),
    path("custom/", create_custom_exam, name="exam-custom"),
    path("solve/<int:exam_id>/", submit_exam, name="exam-solve"),
    path("result/<int:submission_id>/", exam_result, name="exam-result"),
]