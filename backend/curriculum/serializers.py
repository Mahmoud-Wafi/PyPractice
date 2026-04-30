from rest_framework import serializers
from .models import Level, Question, TestCase, Hint, UserProgress
from .access import (
    get_level_lock_reason,
    get_question_lock_reason,
    is_level_completed,
)

class HintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hint
        fields = ['id', 'content', 'order']

class TestCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestCase
        fields = ['id', 'input_data', 'expected_output', 'is_hidden', 'order']

class QuestionListSerializer(serializers.ModelSerializer):
    hint_count = serializers.SerializerMethodField()
    is_unlocked = serializers.SerializerMethodField()
    locked_reason = serializers.SerializerMethodField()
    is_solved = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = [
            'id', 'title', 'description', 'order', 'points', 'hint_count',
            'is_unlocked', 'locked_reason', 'is_solved',
        ]

    def get_hint_count(self, obj):
        return obj.hints.count()

    def get_is_unlocked(self, obj):
        request = self.context.get('request')
        return not get_question_lock_reason(request.user, obj) if request else False

    def get_locked_reason(self, obj):
        request = self.context.get('request')
        return get_question_lock_reason(request.user, obj) if request else 'Sign in to unlock this question.'

    def get_is_solved(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.submissions.filter(user=request.user, status='accepted').exists()

class QuestionDetailSerializer(serializers.ModelSerializer):
    hints = HintSerializer(many=True, read_only=True)
    test_cases = serializers.SerializerMethodField()
    level_slug = serializers.CharField(source='level.slug', read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'title', 'description', 'starter_code', 'order', 'points', 'level_slug', 'hints', 'test_cases']

    def get_test_cases(self, obj):
        visible = obj.test_cases.filter(is_hidden=False)
        return TestCaseSerializer(visible, many=True).data

class UserProgressSerializer(serializers.ModelSerializer):
    level_name = serializers.CharField(source='level.name', read_only=True)
    level_slug = serializers.CharField(source='level.slug', read_only=True)
    total_questions = serializers.SerializerMethodField()
    completion_pct = serializers.SerializerMethodField()

    class Meta:
        model = UserProgress
        fields = ['level_name', 'level_slug', 'questions_completed', 'total_score', 'total_questions', 'completion_pct', 'last_activity']

    def get_total_questions(self, obj):
        return obj.level.questions.filter(is_active=True).count()

    def get_completion_pct(self, obj):
        total = obj.level.questions.filter(is_active=True).count()
        if total == 0:
            return 0
        return round((obj.questions_completed / total) * 100)

class LevelSerializer(serializers.ModelSerializer):
    question_count = serializers.SerializerMethodField()
    user_progress = serializers.SerializerMethodField()
    is_unlocked = serializers.SerializerMethodField()
    locked_reason = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = Level
        fields = [
            'id', 'slug', 'name', 'description', 'order', 'color', 'icon',
            'question_count', 'user_progress', 'is_unlocked', 'locked_reason',
            'is_completed',
        ]

    def get_question_count(self, obj):
        return obj.questions.filter(is_active=True).count()

    def get_user_progress(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            progress = UserProgress.objects.filter(user=request.user, level=obj).first()
            if progress:
                return UserProgressSerializer(progress).data
        return None

    def get_is_unlocked(self, obj):
        request = self.context.get('request')
        return not get_level_lock_reason(request.user, obj) if request else False

    def get_locked_reason(self, obj):
        request = self.context.get('request')
        return get_level_lock_reason(request.user, obj) if request else 'Sign in to unlock this level.'

    def get_is_completed(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return is_level_completed(request.user, obj)
