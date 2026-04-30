from rest_framework import serializers
from .models import Submission

class SubmissionCreateSerializer(serializers.Serializer):
    question_id = serializers.UUIDField()
    code = serializers.CharField(max_length=51200)

class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = ['id', 'question', 'status', 'score', 'stdout', 'stderr',
                  'runtime_ms', 'test_results', 'submitted_at']
        read_only_fields = fields
