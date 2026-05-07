FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (required for psycopg2/Postgres extensions)
RUN apt-get update && apt-get install -y libpq-dev gcc curl postgresql-client && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application logic
COPY . .

# Expose the FastAPI port
EXPOSE 8080
