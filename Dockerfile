# PEGTech — full-stack single service (FastAPI backend + Vite SPA) for Railway
# Stage 1: Build the React frontend
FROM node:22-slim AS frontend
WORKDIR /site
COPY site/package.json site/package-lock.json ./
RUN npm install
COPY site/ ./
RUN npm run build

# Stage 2: Python backend serving the built SPA
FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY api/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Cache-buster: change this value to force Docker to re-copy api/app/
# and pick up schemas.py with EnquiryIn
ARG PEGTech_BUILD_REFRESH=2
ENV PEGTech_BUILD_REFRESH=$PEGTech_BUILD_REFRESH

COPY api/app ./app

# Copy the built SPA from the frontend stage to where main.py serves it
COPY --from=frontend /site/dist /site/dist

ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
