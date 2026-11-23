# Lead Gen SaaS — Railway Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app ./app
COPY frontend ./frontend

# Expose Railway port
ENV PORT=8080
EXPOSE 8080

# Health check for Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/healthz || exit 1

# Start the server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]