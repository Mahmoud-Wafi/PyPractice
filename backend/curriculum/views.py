from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from .models import Level, Question, UserProgress
from .serializers import LevelSerializer, QuestionListSerializer, QuestionDetailSerializer, UserProgressSerializer
from .access import get_question_lock_reason

class LevelListView(generics.ListAPIView):
    queryset = Level.objects.all()
    serializer_class = LevelSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

class QuestionListView(generics.ListAPIView):
    serializer_class = QuestionListSerializer

    def get_queryset(self):
        slug = self.kwargs['level_slug']
        return Question.objects.filter(level__slug=slug, is_active=True)

class QuestionDetailView(generics.RetrieveAPIView):
    queryset = Question.objects.filter(is_active=True)
    serializer_class = QuestionDetailSerializer

    def get_object(self):
        question = super().get_object()
        reason = get_question_lock_reason(self.request.user, question)
        if reason:
            raise PermissionDenied(reason)
        return question

class ProgressView(generics.ListAPIView):
    serializer_class = UserProgressSerializer

    def get_queryset(self):
        return UserProgress.objects.filter(user=self.request.user).select_related('level')
