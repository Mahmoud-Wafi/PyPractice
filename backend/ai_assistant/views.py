from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings
from curriculum.models import Question
import json

def get_ai_response(messages: list, system: str) -> str:
    """Call OpenAI or return a mock response if no API key."""
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        # Mock response for development without API key
        user_msg = messages[-1]['content'] if messages else ''
        return (
            f"Great question! Here's a hint: think about what data structure would work best for this problem. "
            f"Consider breaking the problem into smaller steps. "
            f"You asked: '{user_msg[:100]}' — try debugging line by line."
        )
    try:
        import urllib.request
        payload = json.dumps({
            'model': settings.AI_MODEL,
            'messages': [{'role': 'system', 'content': system}] + messages,
            'max_tokens': 400,
            'temperature': 0.7,
        }).encode()
        req = urllib.request.Request(
            'https://api.openai.com/v1/chat/completions',
            data=payload,
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            }
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
            return data['choices'][0]['message']['content']
    except Exception as e:
        return f"AI service temporarily unavailable. Please try again later. (Error: {str(e)[:100]})"


class ChatView(APIView):
    def post(self, request):
        question_id = request.data.get('question_id')
        message = request.data.get('message', '').strip()
        history = request.data.get('history', [])

        if not message:
            return Response({'error': 'Message required'}, status=400)

        question_context = ''
        if question_id:
            try:
                q = Question.objects.get(id=question_id)
                question_context = f"\nQuestion: {q.title}\nDescription: {q.description[:500]}"
            except Question.DoesNotExist:
                pass

        system = f"""You are PyBot, a friendly Python tutor for a learning platform.
Your role: guide students using the Socratic method — ask questions, give hints, never give complete solutions.
Be encouraging, concise (max 3 sentences), and use simple language.
If the student is stuck, give a targeted hint about the approach, not the answer.{question_context}"""

        messages = [{'role': m['role'], 'content': m['content']} for m in history[-6:]]
        messages.append({'role': 'user', 'content': message})

        reply = get_ai_response(messages, system)
        return Response({'reply': reply})


class HintView(APIView):
    def post(self, request, question_id):
        try:
            q = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        code = request.data.get('code', '')
        system = f"""You are a Python tutor. Give ONE specific hint for this problem.
Problem: {q.title}
Description: {q.description[:400]}
Do NOT give the full solution. One sentence hint only."""

        messages = [{'role': 'user', 'content': f'Give me a hint. My current code:\n```python\n{code[:500]}\n```'}]
        hint = get_ai_response(messages, system)
        return Response({'hint': hint})
