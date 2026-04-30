# ── PyLearn Development Makefile ──────────────────────────

.PHONY: help install dev-backend dev-frontend test clean docker-up docker-down deploy

help:
	@echo "PyLearn Development Commands:"
	@echo ""
	@echo "  make install        - Install all dependencies"
	@echo "  make dev-backend    - Run Django dev server"
	@echo "  make dev-frontend   - Run React dev server"
	@echo "  make test           - Run all tests"
	@echo "  make docker-up      - Start all services with Docker"
	@echo "  make docker-down    - Stop Docker services"
	@echo "  make clean          - Remove build artifacts"
	@echo "  make deploy         - Deploy to production"

install:
	@echo "→ Installing backend dependencies..."
	cd backend && pip install -r requirements.txt --break-system-packages
	@echo "→ Installing frontend dependencies..."
	cd frontend && npm install --legacy-peer-deps
	@echo "✓ Dependencies installed"

dev-backend:
	cd backend && python manage.py migrate && python manage.py seed && python manage.py runserver

dev-frontend:
	cd frontend && npm start

test:
	@echo "→ Running backend tests..."
	cd backend && python manage.py test submissions --verbosity=2
	@echo "→ Building frontend..."
	cd frontend && npm run build
	@echo "✓ All tests passed"

clean:
	find . -name "*.pyc" -delete
	find . -name "__pycache__" -delete
	rm -rf backend/staticfiles/
	rm -rf frontend/build/
	rm -rf frontend/node_modules/
	@echo "✓ Cleaned"

docker-up:
	docker-compose up --build

docker-down:
	docker-compose down

deploy:
	@echo "→ Building production images..."
	docker-compose -f docker-compose.prod.yml build
	@echo "→ Deploying..."
	docker-compose -f docker-compose.prod.yml up -d
	@echo "✓ Deployed"
