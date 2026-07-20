FROM python:3.11-slim

WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Upgrade pip and install with higher timeout and retries
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --default-timeout=300 --retries=10 -r requirements.txt

# Copy the source code
COPY . .

# Expose API port
EXPOSE 10000
