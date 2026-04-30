from submissions.models import Submission


def _accepted_question_ids(user):
    if not user or not user.is_authenticated:
        return set()
    return set(
        Submission.objects
        .filter(user=user, status='accepted')
        .values_list('question_id', flat=True)
    )


def is_level_completed(user, level):
    total = level.questions.filter(is_active=True).count()
    if total == 0:
        return True

    solved = (
        Submission.objects
        .filter(user=user, question__level=level, status='accepted')
        .values('question')
        .distinct()
        .count()
    )
    return solved >= total


def get_level_lock_reason(user, level):
    if not user or not user.is_authenticated:
        return 'Sign in to unlock this level.'

    previous_levels = level.__class__.objects.filter(order__lt=level.order).order_by('order')
    for previous in previous_levels:
        if not is_level_completed(user, previous):
            return f'Finish {previous.name} before starting {level.name}.'
    return ''


def is_level_unlocked(user, level):
    return get_level_lock_reason(user, level) == ''


def get_question_lock_reason(user, question):
    level_reason = get_level_lock_reason(user, question.level)
    if level_reason:
        return level_reason

    solved_ids = _accepted_question_ids(user)
    previous_questions = question.level.questions.filter(
        is_active=True,
        order__lt=question.order,
    ).order_by('order')

    for previous in previous_questions:
        if previous.id not in solved_ids:
            return f'Solve "{previous.title}" before opening this question.'
    return ''


def is_question_unlocked(user, question):
    return get_question_lock_reason(user, question) == ''
