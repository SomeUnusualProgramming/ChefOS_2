#!/bin/bash

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama to start..."
until curl -s http://ollama:11434/api/tags > /dev/null 2>&1; do
    sleep 2
done

# Check if model exists, if not pull it
echo "🔍 Checking for model: $OLLAMA_MODEL"
if ! curl -s http://ollama:11434/api/tags | grep -q "$OLLAMA_MODEL"; then
    echo "📥 Pulling model: $OLLAMA_MODEL (this may take a few minutes)..."
    curl -s -X POST http://ollama:11434/api/pull -d "{\"name\": \"$OLLAMA_MODEL\"}" > /dev/null
    echo "✅ Model pulled successfully"
else
    echo "✅ Model already exists"
fi

# Start the application
echo "🚀 Starting FastAPI backend..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
