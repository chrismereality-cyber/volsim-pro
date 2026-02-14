#!/bin/bash

PORT=8080

# Remove old containers
docker rm -f volsim-api volsim-db >/dev/null 2>&1

# Ensure db-init folder exists
mkdir -p db-init

# Start PostgreSQL container
docker run -d \
  --name volsim-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=postgres \
  -p 5432:5432 \
  -v $(pwd)/db-init:/docker-entrypoint-initdb.d \
  postgres:15

echo "Waiting for database to be ready..."

until docker exec volsim-db pg_isready -U postgres >/dev/null 2>&1; do
  sleep 1
done

echo "Database ready!"

# Start the Volsim API container
docker run -d \
  --name volsim-api \
  --link volsim-db:db \
  -p $PORT:8080 \
  --env-file .env \
  volsim-api:local

# Message after container starts
echo "Volsim API is now running on port $PORT"
