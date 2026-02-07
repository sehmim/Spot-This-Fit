FROM python:3.11-slim

WORKDIR /app

# Install system deps for Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl libjpeg62-turbo-dev zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

ENV PORT=5111
EXPOSE ${PORT}

CMD ["python", "main.py"]
