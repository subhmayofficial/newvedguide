#!/bin/bash
export PATH="/Users/sameerkumar/.nvm/versions/node/v22.22.2/bin:$PATH"
cd /Users/sameerkumar/vedguide
# Kill any existing next dev server
kill 2997 2>/dev/null || true
sleep 1
exec npm run dev
