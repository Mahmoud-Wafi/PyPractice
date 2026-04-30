#!/bin/bash
set -e

echo "🐍 PyLearn Dev Startup"
echo "====================="

# Backend
echo ""
echo "→ Starting Django backend..."
cd backend
pip install -r requirements.txt -q
python manage.py migrate -v 0
python manage.py seed 2>/dev/null || echo "  (already seeded)"
python manage.py runserver 8000 &
BACKEND_PID=$!
echo "  Backend running at http://localhost:8000 (PID: $BACKEND_PID)"

# Frontend
echo ""
echo "→ Starting React frontend..."
cd ../frontend
npm install --legacy-peer-deps -q
npm start &
FRONTEND_PID=$!
echo "  Frontend running at http://localhost:3000 (PID: $FRONTEND_PID)"

echo ""
echo "✅ PyLearn is running!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   Admin:    http://localhost:8000/admin"
echo ""
echo "Press Ctrl+C to stop both servers"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" INT TERM
wait
