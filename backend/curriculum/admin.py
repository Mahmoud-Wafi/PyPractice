from django.contrib import admin
from .models import Level, Question, TestCase, Hint, UserProgress

class TestCaseInline(admin.TabularInline):
    model = TestCase
    extra = 1

class HintInline(admin.TabularInline):
    model = Hint
    extra = 1

@admin.register(Level)
class LevelAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'order']

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['title', 'level', 'order', 'points', 'is_active']
    list_filter = ['level', 'is_active']
    inlines = [TestCaseInline, HintInline]

@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'level', 'questions_completed', 'total_score']
