from django.contrib import admin

from .models import Answer, Exam, ExamProblem, Submission


class ExamProblemInline(admin.TabularInline):
    model = ExamProblem
    extra = 0
    fields = ("problem", "order")


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    inlines = [ExamProblemInline]


admin.site.register(Submission)
admin.site.register(Answer)
