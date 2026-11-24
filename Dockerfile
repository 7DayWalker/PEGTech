# PEGTech — full-stack single service (FastAPI backend + Vite SPA) for Railway
# Stage 1: Build the React frontend
FROM node:22-slim AS frontend
WORKDIR /site
COPY site/package.json site/package-lock.json ./
RUN npm install
COPY site/ ./
RUN npm run build

# Stage 2: Python backend serving the built SPA
FROM python:3.11
WORKDIR /app

COPY api/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Cache-buster: change this value to force Docker to re-copy api/app/
# and pick up schemas.py with EnquiryIn
ARG PEGTech_BUILD_REFRESH=4
ENV PEGTech_BUILD_REFRESH=$PEGTech_BUILD_REFRESH

COPY api/app/ ./app/

# Runtime patch: guarantee EnquiryIn exists in schemas.py regardless of
# any stale Docker layer cache that may serve an outdated schemas.py
RUN python -c "
from pathlib import Path
p = Path('/app/app/schemas.py')
c = p.read_text()
if 'class EnquiryIn' not in c:
    c += '''

# ---------------------------------------------------------------------------
# Enquiries
# ---------------------------------------------------------------------------
class EnquiryIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=60)
    company: Optional[str] = Field(None, max_length=255)
    service: Optional[str] = Field(None, max_length=160)
    message: str = Field(min_length=1)
'''
    p.write_text(c)
    print('EnquiryIn patched into schemas.py')
else:
    print('EnquiryIn already present in schemas.py')
"

# Copy the built SPA from the frontend stage to where main.py serves it
COPY --from=frontend /site/dist /site/dist

ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
