from django.db import models
import uuid

class Submission(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('accepted', 'Accepted'),
        ('wrong_answer', 'Wrong Answer'),
        ('error', 'Error'),
        ('timeout', 'Timeout'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='submissions')
    question = models.ForeignKey('curriculum.Question', on_delete=models.CASCADE, related_name='submissions')
    code = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    score = models.IntegerField(default=0)
    stdout = models.TextField(blank=True)
    stderr = models.TextField(blank=True)
    runtime_ms = models.IntegerField(default=0)
    test_results = models.JSONField(default=list)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-submitted_at']
