FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --index-url https://pypi.tuna.tsinghua.edu.cn/simple \
    --default-timeout=1000 \
    --retries=20 \
    -r requirements.txt
COPY . .
CMD ["python", "mt5_bridge.py"]
