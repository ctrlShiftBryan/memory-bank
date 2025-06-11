#!/bin/bash

echo "Starting test environment..."

# Start Docker containers
echo "Starting Docker containers..."
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up -d

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 10

# Initialize database
echo "Initializing database..."
docker exec -i personalassistant-postgres-test-1 psql -U testuser -d personal_assistant_test < backend/scripts/init-db.sql

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
for i in {1..30}; do
  if curl -s http://localhost:3003/api/auth/register -X POST -H "Content-Type: application/json" -d '{"email":"check@test.com","password":"test","name":"check"}' > /dev/null 2>&1; then
    echo "Backend is ready!"
    break
  fi
  echo "Waiting for backend... ($i/30)"
  sleep 2
done

# Start the frontend web server in the background
echo "Starting frontend web server..."
npm run web -- --port 8081 &
FRONTEND_PID=$!

# Wait for frontend to be ready
echo "Waiting for frontend to be ready..."
for i in {1..30}; do
  if curl -s http://localhost:8081 > /dev/null 2>&1; then
    echo "Frontend is ready!"
    break
  fi
  echo "Waiting for frontend... ($i/30)"
  sleep 2
done

# Run tests
echo "Running tests..."
echo "1. Running Jest unit tests..."
npm test -- --no-watch

echo "2. Running Playwright e2e tests..."
USE_DOCKER_COMPOSE=true npm run test:e2e -- --reporter=list

# Kill the frontend server
kill $FRONTEND_PID

# Clean up
echo "Cleaning up..."
docker-compose -f docker-compose.test.yml down

echo "Tests completed!"