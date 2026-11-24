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

# Cache-buster: forces full rebuild to pick up schemas.py EnquiryIn fix
ENV PEGTech_BUILD_REFRESH=3

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY api/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend app files individually so each has its own
# content-based cache key. This prevents stale Docker layer cache
# from serving an outdated schemas.py (missing EnquiryIn).
COPY api/app/main.py ./app/main.py
COPY api/app/models.py ./app/models.py
COPY api/app/schemas.py ./app/schemas.py
COPY api/app/config.py ./app/config.py
COPY api/app/db.py ./app/db.py
COPY api/app/deps.py ./app/deps.py
COPY api/app/security.py ./app/security.py
COPY api/app/security_routes.py ./app/security_routes.py
COPY api/app/seed.py ./app/seed.py
COPY api/app/services.py ./app/services.py
COPY api/app/routers ./app/routers
COPY api/app/services ./app/services

# Copy the built SPA from the frontend stage to where main.py serves it
# (main.py resolves SITE_DIST to /site/dist)
COPY --from=frontend /site/dist /site/dist

ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
