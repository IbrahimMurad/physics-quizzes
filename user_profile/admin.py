from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User

from tracker.models import ExamTracker

from .models import Profile


class ProfileInline(admin.StackedInline):
    model = Profile


class ExamTrackerInline(admin.StackedInline):
    model = ExamTracker


class CustomUserAdmin(UserAdmin):
    inlines = (ProfileInline, ExamTrackerInline)


admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
admin.site.register(Profile)
