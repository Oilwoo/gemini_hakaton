# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies
# ffmpeg: for video processing
# libgl1, libglib2.0-0, libsm6, libxext6: for OpenCV and other media libs
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Install Python dependencies
# Use cache mount to speed up pip installs even if requirements change
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

# Copy project files
# This step is AFTER pip install, so changes in main.py will NOT trigger pip install
COPY . .

# Create directories for volumes
RUN mkdir -p /app/outputs /app/uploads

# Expose the port the app runs on
EXPOSE 7860

# Command to run the application
CMD ["python", "main.py"]
