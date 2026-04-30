from django.urls import path
from .views import LevelListView, QuestionListView, QuestionDetailView, ProgressView

urlpatterns = [
    path('levels/', LevelListView.as_view()),
    path('levels/<str:level_slug>/questions/', QuestionListView.as_view()),
    path('questions/<uuid:pk>/', QuestionDetailView.as_view()),
    path('progress/', ProgressView.as_view()),
]
