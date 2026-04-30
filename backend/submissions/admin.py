from django.contrib import admin
from .models import Submission

@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ['user', 'question', 'status', 'score', 'submitted_at']
    list_filter = ['status']
    readonly_fields = ['test_results', 'stdout', 'stderr']
