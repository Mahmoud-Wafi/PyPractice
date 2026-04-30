import logging
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Submission
from curriculum.models import Question, UserProgress
from .serializers import SubmissionSerializer, SubmissionCreateSerializer
from .executor import grade_submission, run_code as execute_code
from curriculum.access import get_question_lock_reason

logger = logging.getLogger('submissions')


class SubmitView(APIView):
    def post(self, request):
        serializer = SubmissionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        question_id = serializer.validated_data['question_id']
        code        = serializer.validated_data['code']

        try:
            question = Question.objects.get(id=question_id, is_active=True)
        except Question.DoesNotExist:
            return Response({'error': 'Question not found'}, status=404)

        lock_reason = get_question_lock_reason(request.user, question)
        if lock_reason:
            return Response({'detail': lock_reason}, status=403)

        test_cases = list(question.test_cases.all().order_by('order'))

        if not test_cases:
            result = execute_code(code)
            grade = {
                'status':       'accepted' if result['exit_code'] == 0 else 'error',
                'score':        100        if result['exit_code'] == 0 else 0,
                'test_results': [],
                'stdout':       result['stdout'],
                'stderr':       result['stderr'],
            }
        else:
            grade = grade_submission(code, test_cases)

        submission = Submission.objects.create(
            user=request.user,
            question=question,
            code=code,
            status=grade['status'],
            score=grade['score'],
            stdout=grade.get('stdout', ''),
            stderr=grade.get('stderr', ''),
            test_results=grade['test_results'],
        )

        if grade['status'] == 'accepted':
            self._update_progress(request.user, question)

        logger.info('Submission %s by %s: %s (%d/100)', submission.id, request.user.email, grade['status'], grade['score'])
        return Response(SubmissionSerializer(submission).data, status=201)

    def _update_progress(self, user, question):
        level    = question.level
        progress, _ = UserProgress.objects.get_or_create(user=user, level=level)
        solved = (
            Submission.objects
            .filter(user=user, question__level=level, status='accepted')
            .values('question')
            .distinct()
            .count()
        )
        progress.questions_completed = solved
        progress.total_score         = solved * 100
        progress.save()


class SubmissionHistoryView(generics.ListAPIView):
    serializer_class = SubmissionSerializer

    def get_queryset(self):
        qid = self.kwargs.get('question_id')
        if qid:
            return Submission.objects.filter(user=self.request.user, question_id=qid).order_by('-submitted_at')[:10]
        return Submission.objects.none()


class AllSubmissionsView(generics.ListAPIView):
    """All submissions by the current user — used for heatmap / profile."""
    serializer_class = SubmissionSerializer

    def get_queryset(self):
        return (
            Submission.objects
            .filter(user=self.request.user)
            .order_by('-submitted_at')
            .only('id', 'status', 'score', 'submitted_at', 'question_id')
        )


class RunCodeView(APIView):
    """Run code without grading (the Run button)."""
    def post(self, request):
        code  = request.data.get('code', '').strip()
        stdin = request.data.get('stdin', '')
        if not code:
            return Response({'error': 'No code provided'}, status=400)
        result = execute_code(code, stdin)
        return Response(result)


class StatsView(APIView):
    """Aggregate stats for the current user."""
    def get(self, request):
        from django.db.models import Count, Max
        qs = Submission.objects.filter(user=request.user)
        total          = qs.count()
        accepted       = qs.filter(status='accepted').count()
        unique_solved  = qs.filter(status='accepted').values('question').distinct().count()
        last_sub       = qs.aggregate(last=Max('submitted_at'))['last']
        by_status      = dict(qs.values_list('status').annotate(n=Count('id')))
        return Response({
            'total_submissions': total,
            'accepted':          accepted,
            'unique_solved':     unique_solved,
            'acceptance_rate':   round((accepted / total * 100), 1) if total else 0,
            'last_submission':   last_sub,
            'by_status':         by_status,
        })
