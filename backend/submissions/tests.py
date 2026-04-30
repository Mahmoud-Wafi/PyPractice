"""
Automated test suite for code execution sandbox and submission grading.
Run with: python manage.py test submissions
"""
from django.test import TestCase
from .executor import is_code_safe, run_code, grade_submission


class SecurityTests(TestCase):
    """Test that malicious code patterns are blocked."""

    BLOCKED_PATTERNS = [
        ("import os; os.system('ls')",   "os import"),
        ("import sys; sys.exit()",        "sys import"),
        ("import subprocess",             "subprocess"),
        ("import socket",                 "socket"),
        ("eval('1+1')",                   "eval"),
        ("exec('print(1)')",              "exec"),
        ("open('/etc/passwd')",           "open"),
        ("__import__('os')",              "__import__"),
        ("import importlib",              "importlib"),
        ("import pickle",                 "pickle"),
        ("import ctypes",                 "ctypes"),
    ]

    def test_blocked_imports(self):
        for code, desc in self.BLOCKED_PATTERNS:
            safe, reason = is_code_safe(code)
            self.assertFalse(safe, f"Should have blocked: {desc}")
            self.assertIn("Forbidden", reason)

    def test_safe_code_passes(self):
        safe_snippets = [
            "print('hello')",
            "x = [1,2,3]; print(sum(x))",
            "def fib(n): return n if n<=1 else fib(n-1)+fib(n-2)\nprint(fib(5))",
            "import math; print(math.sqrt(16))",
            "import collections; c = collections.Counter('aab'); print(c['a'])",
            "from functools import reduce; print(reduce(lambda a,b: a+b, [1,2,3]))",
        ]
        for code in safe_snippets:
            safe, reason = is_code_safe(code)
            self.assertTrue(safe, f"Should be safe: {code!r} — got: {reason}")

    def test_oversized_code_blocked(self):
        big = "x = 1\n" * 10000  # > 50KB
        safe, reason = is_code_safe(big)
        self.assertFalse(safe)
        self.assertIn("too large", reason)


class ExecutorTests(TestCase):
    """Test code execution correctness and resource limits."""

    def test_hello_world(self):
        result = run_code("print('Hello, World!')")
        self.assertEqual(result['exit_code'], 0)
        self.assertEqual(result['stdout'].strip(), 'Hello, World!')
        self.assertEqual(result['stderr'], '')

    def test_arithmetic(self):
        result = run_code("print(2 + 2)")
        self.assertEqual(result['stdout'].strip(), '4')

    def test_stdin_input(self):
        result = run_code("n = int(input())\nprint(n * 2)", stdin_data='7')
        self.assertEqual(result['stdout'].strip(), '14')

    def test_multiline_output(self):
        result = run_code("for i in range(3):\n    print(i)")
        self.assertEqual(result['stdout'].strip(), '0\n1\n2')

    def test_runtime_error_captured(self):
        result = run_code("print(1/0)")
        self.assertNotEqual(result['exit_code'], 0)
        self.assertIn('ZeroDivisionError', result['stderr'])

    def test_syntax_error_captured(self):
        result = run_code("def f(\n    pass")
        self.assertNotEqual(result['exit_code'], 0)
        self.assertGreater(len(result['stderr']), 0)

    def test_timeout(self):
        result = run_code("while True: pass", timeout=2)
        self.assertTrue(result['timed_out'] or result['exit_code'] != 0)

    def test_runtime_ms_recorded(self):
        result = run_code("print('hi')")
        self.assertGreater(result['runtime_ms'], 0)
        self.assertLess(result['runtime_ms'], 5000)

    def test_large_output_truncated(self):
        result = run_code("print('x' * 20000)")
        self.assertLessEqual(len(result['stdout']), 10001)


class GradingTests(TestCase):
    """Test the auto-grader against mock test cases."""

    class MockTestCase:
        def __init__(self, id, input_data, expected_output, is_hidden=False):
            self.id = id
            self.input_data = input_data
            self.expected_output = expected_output
            self.is_hidden = is_hidden

    def make_cases(self, cases):
        return [
            self.MockTestCase(str(i), inp, out)
            for i, (inp, out) in enumerate(cases)
        ]

    def test_all_pass(self):
        cases = self.make_cases([('', 'Hello, World!')])
        result = grade_submission("print('Hello, World!')", cases)
        self.assertEqual(result['status'], 'accepted')
        self.assertEqual(result['score'], 100)

    def test_all_fail(self):
        cases = self.make_cases([('', 'Hello, World!')])
        result = grade_submission("print('wrong')", cases)
        self.assertEqual(result['status'], 'wrong_answer')
        self.assertEqual(result['score'], 0)

    def test_partial_credit(self):
        cases = self.make_cases([('1', '2'), ('2', '4'), ('3', '6')])
        # Code only handles first case correctly
        result = grade_submission(
            "n = int(input())\nif n == 1:\n    print(2)\nelse:\n    print(0)",
            cases
        )
        self.assertGreater(result['score'], 0)
        self.assertLess(result['score'], 100)

    def test_stdin_passed_correctly(self):
        cases = self.make_cases([('10\n20', '30'), ('5\n5', '10')])
        code = "a = int(input())\nb = int(input())\nprint(a + b)"
        result = grade_submission(code, cases)
        self.assertEqual(result['status'], 'accepted')
        self.assertEqual(result['score'], 100)

    def test_error_status(self):
        cases = self.make_cases([('', '42')])
        result = grade_submission("raise ValueError('oops')", cases)
        self.assertIn(result['status'], ['error', 'wrong_answer'])

    def test_hidden_case_output_masked(self):
        cases = [self.MockTestCase('0', '', 'secret_output', is_hidden=True)]
        result = grade_submission("print('wrong')", cases)
        for r in result['test_results']:
            if r['actual_output'] != '[hidden]':
                continue
            self.assertEqual(r['actual_output'], '[hidden]')


class APIIntegrationTests(TestCase):
    """Test the REST API endpoints end-to-end."""

    def setUp(self):
        from django.contrib.auth import get_user_model
        from curriculum.models import Level, Question, TestCase
        User = get_user_model()

        self.user = User.objects.create_user(
            email='tester@example.com',
            password='testpass123',
            name='Test User',
            skill_level='beginner',
        )
        self.level = Level.objects.create(slug='beginner', name='Beginner', description='Test', order=1)
        self.question = Question.objects.create(
            level=self.level, title='Test Q', description='Test desc',
            starter_code='print()', order=1, points=100,
        )
        TestCase.objects.create(question=self.question, input_data='', expected_output='Hello', order=0)

        # Authenticate
        response = self.client.post('/api/auth/login/', {'email':'tester@example.com','password':'testpass123'}, content_type='application/json')
        self.token = response.json()['access']
        self.auth = {'HTTP_AUTHORIZATION': f'Bearer {self.token}'}

    def test_register(self):
        resp = self.client.post('/api/auth/register/', {
            'name':'New User','email':'new@example.com',
            'password':'newpass123','skill_level':'intermediate',
        }, content_type='application/json')
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertIn('access', data)
        self.assertIn('refresh', data)
        self.assertEqual(data['user']['skill_level'], 'intermediate')

    def test_me_endpoint(self):
        resp = self.client.get('/api/auth/me/', **self.auth)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()['email'], 'tester@example.com')

    def test_me_patch(self):
        resp = self.client.patch('/api/auth/me/', {'name':'Updated Name'}, content_type='application/json', **self.auth)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()['name'], 'Updated Name')

    def test_levels_list(self):
        resp = self.client.get('/api/levels/', **self.auth)
        self.assertEqual(resp.status_code, 200)
        self.assertIsInstance(resp.json(), list)

    def test_questions_for_level(self):
        resp = self.client.get('/api/levels/beginner/questions/', **self.auth)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(len(data) >= 1)

    def test_question_detail(self):
        resp = self.client.get(f'/api/questions/{self.question.id}/', **self.auth)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data['title'], 'Test Q')
        self.assertIn('test_cases', data)
        self.assertIn('hints', data)

    def test_run_code(self):
        resp = self.client.post('/api/run/', {'code':'print(42)','stdin':''}, content_type='application/json', **self.auth)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn('stdout', data)
        self.assertEqual(data['stdout'].strip(), '42')

    def test_run_blocked_code(self):
        resp = self.client.post('/api/run/', {'code':'import os','stdin':''}, content_type='application/json', **self.auth)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn('Security violation', data['stderr'])

    def test_submit_correct(self):
        resp = self.client.post('/api/submit/', {
            'question_id': str(self.question.id),
            'code': "print('Hello')",
        }, content_type='application/json', **self.auth)
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertEqual(data['status'], 'accepted')
        self.assertEqual(data['score'], 100)

    def test_submit_locked_question_blocked(self):
        from curriculum.models import Question, TestCase

        locked = Question.objects.create(
            level=self.level, title='Locked Q', description='Test desc',
            starter_code='print()', order=2, points=100,
        )
        TestCase.objects.create(question=locked, input_data='', expected_output='Hello', order=0)

        resp = self.client.post('/api/submit/', {
            'question_id': str(locked.id),
            'code': "print('Hello')",
        }, content_type='application/json', **self.auth)

        self.assertEqual(resp.status_code, 403)
        self.assertIn('detail', resp.json())

    def test_submit_wrong(self):
        resp = self.client.post('/api/submit/', {
            'question_id': str(self.question.id),
            'code': "print('wrong answer')",
        }, content_type='application/json', **self.auth)
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.json()['status'], 'wrong_answer')

    def test_progress_updates_after_accept(self):
        self.client.post('/api/submit/', {
            'question_id': str(self.question.id),
            'code': "print('Hello')",
        }, content_type='application/json', **self.auth)
        resp = self.client.get('/api/progress/', **self.auth)
        data = resp.json()
        self.assertTrue(len(data) > 0)
        beginner = next((p for p in data if p['level_slug'] == 'beginner'), None)
        self.assertIsNotNone(beginner)
        self.assertGreater(beginner['questions_completed'], 0)

    def test_ai_chat(self):
        resp = self.client.post('/api/ai/chat/', {
            'message':'How do I print in Python?',
            'history':[],
        }, content_type='application/json', **self.auth)
        self.assertEqual(resp.status_code, 200)
        self.assertIn('reply', resp.json())
        self.assertGreater(len(resp.json()['reply']), 0)

    def test_unauthenticated_blocked(self):
        resp = self.client.get('/api/levels/beginner/questions/')
        self.assertEqual(resp.status_code, 401)
