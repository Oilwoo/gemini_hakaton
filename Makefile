# AI Jikcam Maker - Makefile

VENV = venv
PYTHON = $(VENV)/bin/python3
PIP = $(VENV)/bin/pip3

.PHONY: help install run test clean venv

help:
	@echo "Usage:"
	@echo "  make venv     - Create virtual environment and install dependencies"
	@echo "  make install  - Install/Update dependencies in venv"
	@echo "  make run      - Run the backend server using venv"
	@echo "  make test     - Run the YouTube download test script using venv"
	@echo "  make upload   - Test YouTube upload (requires FILE=path)"
	@echo "  make clean    - Remove temporary files, __pycache__, and venv"

$(VENV)/bin/activate: requirements.txt
	python3 -m venv $(VENV)
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt
	touch $(VENV)/bin/activate

venv: $(VENV)/bin/activate

install: venv
	$(PIP) install -r requirements.txt

build-ui:
	@echo "Building frontend with npm..."
	cd frontend && npm install && npm run build

run: venv build-ui
	@echo "Killing any process on port 7860..."
	@lsof -t -i:7860 | xargs kill -9 || true
	$(PYTHON) main.py

test: venv
	$(PYTHON) test_yt.py

upload: venv
	@if [ -z "$(FILE)" ]; then echo "Usage: make upload FILE=path/to/video.mp4"; exit 1; fi
	$(PYTHON) youtube_uploader.py --file $(FILE)

clean:
	rm -rf __pycache__
	rm -rf .pytest_cache
	rm -rf $(VENV)
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
