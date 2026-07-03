#!/bin/bash
set -e
cd "$(dirname "$0")"

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Starting React frontend on http://localhost:5173 ..."
npm run dev
