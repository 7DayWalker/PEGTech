# Minimal Dockerfile for backend-only health check
FROM python:3.11-slim
WORKDIR /app

COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY api/app ./app

ARG CACHEBUST=1
ENV CACHEBUST=$CACHEBUST

ENV PORT=8080
EXPOSE 8080

CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
