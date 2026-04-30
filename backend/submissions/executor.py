"""
Sandboxed Python code execution using subprocess with strict resource limits.
In production, replace with Docker container execution.
"""
import subprocess
import sys
import time
import os
import tempfile
import resource


FORBIDDEN = [
    'import os', 'import sys', 'import subprocess', 'import socket',
    'import requests', 'import urllib', 'import http', 'import ftplib',
    '__import__', 'eval(', 'exec(', 'open(', 'file(', 'compile(',
    'globals()', 'locals()', 'vars()', 'dir(', 'getattr(', 'setattr(',
    'delattr(', 'hasattr(', '__builtins__', 'importlib', 'pickle',
    'marshal', 'ctypes', 'shutil', 'pathlib', 'glob',
]

def is_code_safe(code: str) -> tuple[bool, str]:
    lower = code.lower()
    for pattern in FORBIDDEN:
        if pattern.lower() in lower:
            return False, f"Forbidden pattern detected: {pattern}"
    if len(code) > 50 * 1024:
        return False, "Code too large (max 50KB)"
    return True, ""

def run_code(code: str, stdin_data: str = '', timeout: int = 5) -> dict:
    safe, reason = is_code_safe(code)
    if not safe:
        return {
            'stdout': '',
            'stderr': f'Security violation: {reason}',
            'exit_code': 1,
            'runtime_ms': 0,
            'timed_out': False,
        }

    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(code)
        tmp_path = f.name

    try:
        start = time.time()
        result = subprocess.run(
            [sys.executable, '-c', f'''
import resource, sys
resource.setrlimit(resource.RLIMIT_AS, (64*1024*1024, 64*1024*1024))
resource.setrlimit(resource.RLIMIT_CPU, ({timeout}, {timeout}))
with open({repr(tmp_path)}) as f:
    exec(compile(f.read(), "solution.py", "exec"), {{"__builtins__": __builtins__}})
'''],
            input=stdin_data,
            capture_output=True,
            text=True,
            timeout=timeout + 1,
        )
        elapsed = int((time.time() - start) * 1000)
        return {
            'stdout': result.stdout[:10000],
            'stderr': result.stderr[:2000],
            'exit_code': result.returncode,
            'runtime_ms': elapsed,
            'timed_out': False,
        }
    except subprocess.TimeoutExpired:
        return {
            'stdout': '',
            'stderr': 'Time limit exceeded',
            'exit_code': 1,
            'runtime_ms': timeout * 1000,
            'timed_out': True,
        }
    except Exception as e:
        return {
            'stdout': '',
            'stderr': str(e),
            'exit_code': 1,
            'runtime_ms': 0,
            'timed_out': False,
        }
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


def grade_submission(code: str, test_cases) -> dict:
    """Run code against all test cases and return grading results."""
    results = []
    passed = 0

    for tc in test_cases:
        result = run_code(code, tc.input_data, timeout=5)
        actual = result['stdout'].strip()
        expected = tc.expected_output.strip()
        status = 'passed' if actual == expected and result['exit_code'] == 0 else 'failed'
        if status == 'passed':
            passed += 1
        results.append({
            'test_case_id': str(tc.id),
            'status': status,
            'actual_output': actual if not tc.is_hidden else '[hidden]',
            'expected_output': expected if not tc.is_hidden else '[hidden]',
            'runtime_ms': result['runtime_ms'],
            'stderr': result['stderr'] if not tc.is_hidden else '',
        })

    total = len(test_cases)
    score = int((passed / total) * 100) if total > 0 else 0

    if result.get('timed_out'):
        overall_status = 'timeout'
    elif passed == total:
        overall_status = 'accepted'
    elif score > 0:
        overall_status = 'wrong_answer'
    else:
        overall_status = 'error' if results and results[-1]['stderr'] else 'wrong_answer'

    return {
        'status': overall_status,
        'score': score,
        'passed': passed,
        'total': total,
        'test_results': results,
        'stdout': results[-1]['actual_output'] if results else '',
        'stderr': results[-1].get('stderr', '') if results else '',
    }
