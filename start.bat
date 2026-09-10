@echo off
REM Double-click this file to run the game locally on Windows.
REM It starts a local static file server (see docs/development-guide.md for
REM why one is needed at all) in its own window, then opens your browser to it.
start "Whisker Line - local server (close this window to stop)" cmd /k "python -m http.server 8000"
timeout /t 1 /nobreak >nul
start "" http://localhost:8000
