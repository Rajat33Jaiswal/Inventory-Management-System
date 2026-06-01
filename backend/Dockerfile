# Stage 1: Build and compile dependencies
FROM python:3.11-slim AS builder

WORKDIR /build

# Install build dependencies for psycopg2 and other packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install dependencies into user directory
RUN pip install --no-cache-dir --user -r requirements.txt


# Stage 2: Runtime image
FROM python:3.11-slim AS runner

WORKDIR /app

# Install runtime database client library dependency
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed libraries and executables from builder
COPY --from=builder /root/.local /root/.local
# Copy application code
COPY . /app

# Add dependencies to system PATH
ENV PATH=/root/.local/bin:$PATH
# Ensure python logs are printed immediately to stdout/stderr
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Start FastAPI application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
