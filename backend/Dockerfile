# Backend Dockerfile - Python + FastAPI
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies including curl
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code and entrypoint
COPY main.py .
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

# Expose port
EXPOSE 8000

# Run the application with entrypoint
CMD ["./entrypoint.sh"]
