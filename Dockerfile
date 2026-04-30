# Use a slim Python image to keep the build fast
FROM python:3.10-slim

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies needed for some Python packages
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code
COPY . .

# Create the data directory for file uploads
RUN mkdir -p data

# Expose the port FastAPI runs on
EXPOSE 8000

# The command to start your API
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
