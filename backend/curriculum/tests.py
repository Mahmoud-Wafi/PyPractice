"""
Tests for curriculum endpoints and models.
Run: python manage.py test curriculum
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from curriculum.models import Level, Question, TestCase as TC, Hint, UserProgress
from submissions.models import Submission

User = get_user_model()

def make_user(email='u@test.com', skill='beginner'):
    return User.objects.create_user(email=email, password='pass123', name='Test', skill_level=skill)

def auth(client, email='u@test.com', password='pass123'):
    r = client.post('/api/auth/login/', {'email': email, 'password': password}, content_type='application/json')
    return {'HTTP_AUTHORIZATION': f"Bearer {r.json()['access']}"}

def make_level(slug='beginner'):
    return Level.objects.get_or_create(
        slug=slug,
        defaults={'name': slug.title(), 'description': 'Test', 'order': 1, 'color': '#00ff88', 'icon': '🐣'}
    )[0]

def make_question(level, title='Test Q', order=1):
    q = Question.objects.create(level=level, title=title, description='Desc', starter_code='pass', order=order, points=100)
    TC.objects.create(question=q, input_data='', expected_output='42', order=0)
    Hint.objects.create(question=q, content='Hint text', order=1)
    return q


class LevelAPITests(TestCase):
    def setUp(self):
        self.user  = make_user()
        self.level = make_level()
        self.q     = make_question(self.level)
        self.auth  = auth(self.client)

    def test_levels_unauthenticated_readable(self):
        r = self.client.get('/api/levels/')
        self.assertEqual(r.status_code, 200)  # levels are public read

    def test_levels_list(self):
        r = self.client.get('/api/levels/', **self.auth)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)
        level = data[0]
        self.assertIn('slug', level)
        self.assertIn('question_count', level)
        self.assertIn('user_progress', level)

    def test_levels_include_progress(self):
        # Create a progress entry
        UserProgress.objects.create(user=self.user, level=self.level, questions_completed=1, total_score=100)
        r = self.client.get('/api/levels/', **self.auth)
        data = r.json()
        lvl = next((l for l in data if l['slug'] == 'beginner'), None)
        self.assertIsNotNone(lvl)
        self.assertIsNotNone(lvl['user_progress'])
        self.assertEqual(lvl['user_progress']['questions_completed'], 1)

    def test_question_list(self):
        r = self.client.get('/api/levels/beginner/questions/', **self.auth)
        self.assertEqual(r.status_code, 200)
        questions = r.json()
        self.assertIsInstance(questions, list)
        self.assertGreater(len(questions), 0)
        q = questions[0]
        self.assertIn('title', q)
        self.assertIn('points', q)
        self.assertIn('hint_count', q)

    def test_question_detail(self):
        r = self.client.get(f'/api/questions/{self.q.id}/', **self.auth)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data['title'], 'Test Q')
        self.assertIn('starter_code', data)
        self.assertIn('hints', data)
        self.assertIn('test_cases', data)
        self.assertEqual(len(data['hints']), 1)
        self.assertEqual(data['hints'][0]['content'], 'Hint text')

    def test_hidden_test_cases_not_exposed(self):
        # Add a hidden test case
        TC.objects.create(question=self.q, input_data='secret', expected_output='secret_out', is_hidden=True, order=1)
        r = self.client.get(f'/api/questions/{self.q.id}/', **self.auth)
        test_cases = r.json()['test_cases']
        # Hidden case should not appear in question detail
        self.assertTrue(all(not tc.get('is_hidden', False) for tc in test_cases))

    def test_inactive_question_not_shown(self):
        q_inactive = Question.objects.create(
            level=self.level, title='Hidden Q', description='D',
            starter_code='', order=99, points=100, is_active=False
        )
        r = self.client.get('/api/levels/beginner/questions/', **self.auth)
        ids = [q['id'] for q in r.json()]
        self.assertNotIn(str(q_inactive.id), ids)

    def test_progress_empty_by_default(self):
        r = self.client.get('/api/progress/', **self.auth)
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

    def test_invalid_level_slug(self):
        r = self.client.get('/api/levels/nonexistent/questions/', **self.auth)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json(), [])

    def test_question_not_found(self):
        import uuid
        r = self.client.get(f'/api/questions/{uuid.uuid4()}/', **self.auth)
        self.assertEqual(r.status_code, 404)

    def test_questions_unlock_in_order(self):
        first = self.q
        second = make_question(self.level, title='Second Q', order=2)

        r = self.client.get('/api/levels/beginner/questions/', **self.auth)
        data = r.json()
        first_row = next(q for q in data if q['id'] == str(first.id))
        second_row = next(q for q in data if q['id'] == str(second.id))
        self.assertTrue(first_row['is_unlocked'])
        self.assertFalse(second_row['is_unlocked'])

        detail = self.client.get(f'/api/questions/{second.id}/', **self.auth)
        self.assertEqual(detail.status_code, 403)

        Submission.objects.create(user=self.user, question=first, code='print(42)', status='accepted', score=100)
        detail = self.client.get(f'/api/questions/{second.id}/', **self.auth)
        self.assertEqual(detail.status_code, 200)

    def test_levels_unlock_in_order(self):
        beginner = self.level
        beginner.order = 1
        beginner.save()
        first = self.q
        second = make_question(beginner, title='Second Q', order=2)
        intermediate = Level.objects.create(slug='intermediate', name='Intermediate', description='Test', order=2)
        intermediate_q = make_question(intermediate, title='Intermediate Q', order=1)

        r = self.client.get('/api/levels/', **self.auth)
        data = r.json()
        intermediate_row = next(l for l in data if l['slug'] == 'intermediate')
        self.assertFalse(intermediate_row['is_unlocked'])

        detail = self.client.get(f'/api/questions/{intermediate_q.id}/', **self.auth)
        self.assertEqual(detail.status_code, 403)

        Submission.objects.create(user=self.user, question=first, code='print(42)', status='accepted', score=100)
        Submission.objects.create(user=self.user, question=second, code='print(42)', status='accepted', score=100)

        r = self.client.get('/api/levels/', **self.auth)
        data = r.json()
        intermediate_row = next(l for l in data if l['slug'] == 'intermediate')
        self.assertTrue(intermediate_row['is_unlocked'])

        detail = self.client.get(f'/api/questions/{intermediate_q.id}/', **self.auth)
        self.assertEqual(detail.status_code, 200)


class UserAPITests(TestCase):
    def setUp(self):
        self.user = make_user()
        self.auth = auth(self.client)

    def test_register_creates_user(self):
        r = self.client.post('/api/auth/register/', {
            'name': 'New User', 'email': 'new2@test.com',
            'password': 'securepass1', 'skill_level': 'advanced',
        }, content_type='application/json')
        self.assertEqual(r.status_code, 201)
        d = r.json()
        self.assertIn('access', d)
        self.assertIn('refresh', d)
        self.assertEqual(d['user']['skill_level'], 'advanced')
        self.assertEqual(d['user']['name'], 'New User')

    def test_register_duplicate_email(self):
        r = self.client.post('/api/auth/register/', {
            'name': 'Dupe', 'email': 'u@test.com',
            'password': 'pass123', 'skill_level': 'beginner',
        }, content_type='application/json')
        self.assertEqual(r.status_code, 400)

    def test_register_short_password(self):
        r = self.client.post('/api/auth/register/', {
            'name': 'X', 'email': 'x@test.com',
            'password': 'abc', 'skill_level': 'beginner',
        }, content_type='application/json')
        self.assertEqual(r.status_code, 400)

    def test_login_valid(self):
        r = self.client.post('/api/auth/login/', {'email': 'u@test.com', 'password': 'pass123'}, content_type='application/json')
        self.assertEqual(r.status_code, 200)
        self.assertIn('access', r.json())
        self.assertIn('refresh', r.json())

    def test_login_wrong_password(self):
        r = self.client.post('/api/auth/login/', {'email': 'u@test.com', 'password': 'wrong'}, content_type='application/json')
        self.assertEqual(r.status_code, 401)

    def test_me_returns_profile(self):
        r = self.client.get('/api/auth/me/', **self.auth)
        self.assertEqual(r.status_code, 200)
        d = r.json()
        self.assertEqual(d['email'], 'u@test.com')
        self.assertEqual(d['skill_level'], 'beginner')

    def test_me_patch_name(self):
        r = self.client.patch('/api/auth/me/', {'name': 'Updated'}, content_type='application/json', **self.auth)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['name'], 'Updated')

    def test_me_patch_skill_level(self):
        r = self.client.patch('/api/auth/me/', {'skill_level': 'advanced'}, content_type='application/json', **self.auth)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['skill_level'], 'advanced')

    def test_me_patch_cannot_change_email(self):
        r = self.client.patch('/api/auth/me/', {'email': 'hacked@test.com'}, content_type='application/json', **self.auth)
        self.assertEqual(r.status_code, 200)
        # Email should NOT change
        self.assertEqual(r.json()['email'], 'u@test.com')

    def test_logout_blacklists_token(self):
        # Login fresh to get a refresh token
        login_r = self.client.post('/api/auth/login/', {'email': 'u@test.com', 'password': 'pass123'}, content_type='application/json')
        refresh = login_r.json()['refresh']
        access  = login_r.json()['access']
        headers = {'HTTP_AUTHORIZATION': f'Bearer {access}'}

        # Logout
        logout_r = self.client.post('/api/auth/logout/', {'refresh': refresh}, content_type='application/json', **headers)
        self.assertEqual(logout_r.status_code, 200)

        # Refresh should now fail
        r = self.client.post('/api/auth/refresh/', {'refresh': refresh}, content_type='application/json')
        self.assertEqual(r.status_code, 401)

    def test_leaderboard(self):
        r = self.client.get('/api/auth/leaderboard/', **self.auth)
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

    def test_unauthenticated_me_blocked(self):
        r = self.client.get('/api/auth/me/')
        self.assertEqual(r.status_code, 401)
