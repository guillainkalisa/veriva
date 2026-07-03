#!/bin/bash
set -e
cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv venv
  ./venv/bin/pip install -q -r requirements.txt
fi

echo "Running migrations..."
./venv/bin/python manage.py migrate --run-syncdb

echo "Starting Django backend on http://localhost:8000 ..."
./venv/bin/python manage.py runserver 0.0.0.0:8000
