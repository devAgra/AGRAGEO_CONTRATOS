FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gdal-bin \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements_etl.txt .
RUN pip install --no-cache-dir -r requirements_etl.txt

COPY . .

CMD ["python", "scheduler.py"]
