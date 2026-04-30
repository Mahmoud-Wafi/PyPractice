from django.urls import path
from .views import ChatView, HintView

urlpatterns = [
    path('chat/', ChatView.as_view()),
    path('hint/<uuid:question_id>/', HintView.as_view()),
]
