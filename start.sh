#!/bin/sh
# Run this to play the game locally on macOS/Linux.
# Starts a local static file server (see docs/development-guide.md for why
# one is needed at all) and opens your browser to it.
python3 -m http.server 8000 &
SERVER_PID=$!
sleep 1
if command -v open >/dev/null 2>&1; then
  open http://localhost:8000
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open http://localhost:8000
else
  echo "Open http://localhost:8000 in your browser."
fi
echo "Server running (PID $SERVER_PID). Press Ctrl+C to stop it."
wait $SERVER_PID
