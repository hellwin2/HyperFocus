# Use a lightweight official Python image
FROM python:3.11-slim

# Avoid Python buffering logs
ENV PYTHONUNBUFFERED=1

# Set workdir inside the container
WORKDIR /app

# Install system deps (needed for argon2 build sometimes, though wheels usually exist)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the project
COPY . .

# Expose FastAPI / Uvicorn port
EXPOSE 8000

# Run the FastAPI app with Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
