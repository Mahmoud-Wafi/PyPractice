from django.db import models
import uuid

class Level(models.Model):
    LEVEL_CHOICES = [('beginner', 'Beginner'), ('intermediate', 'Intermediate'), ('advanced', 'Advanced')]
    slug = models.CharField(max_length=20, unique=True, choices=LEVEL_CHOICES)
    name = models.CharField(max_length=50)
    description = models.TextField()
    order = models.IntegerField()
    color = models.CharField(max_length=20, default='#10b981')
    icon = models.CharField(max_length=10, default='🐍')

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name

class Question(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    level = models.ForeignKey(Level, on_delete=models.CASCADE, related_name='questions')
    title = models.CharField(max_length=200)
    description = models.TextField()
    starter_code = models.TextField(default='# Write your solution here\n')
    expected_output_description = models.TextField(blank=True)
    order = models.IntegerField()
    points = models.IntegerField(default=100)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f'{self.level.name} - {self.title}'

class TestCase(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='test_cases')
    input_data = models.TextField(blank=True)
    expected_output = models.TextField()
    is_hidden = models.BooleanField(default=False)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

class Hint(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='hints')
    content = models.TextField()
    order = models.IntegerField()

    class Meta:
        ordering = ['order']

class UserProgress(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='progress')
    level = models.ForeignKey(Level, on_delete=models.CASCADE)
    questions_completed = models.IntegerField(default=0)
    total_score = models.IntegerField(default=0)
    last_activity = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'level']
