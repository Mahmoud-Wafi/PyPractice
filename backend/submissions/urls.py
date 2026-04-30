from django.urls import path
from .views import SubmitView, SubmissionHistoryView, AllSubmissionsView, RunCodeView, StatsView

urlpatterns = [
    path('submit/',                                  SubmitView.as_view()),
    path('run/',                                     RunCodeView.as_view()),
    path('submissions/',                             AllSubmissionsView.as_view()),
    path('submissions/stats/',                       StatsView.as_view()),
    path('questions/<uuid:question_id>/submissions/', SubmissionHistoryView.as_view()),
]
