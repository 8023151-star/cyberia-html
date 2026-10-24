#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
echo 'Cyberia is available at http://127.0.0.1:8000/'
echo 'Press Ctrl+C to stop the site.'
exec python3 -m http.server 8000 --bind 127.0.0.1
