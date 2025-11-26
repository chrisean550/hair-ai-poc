@echo off
echo Starting Hair AI POC...
echo Building Client...
cd client
call npm install
call npm run build
cd ..

echo Starting Server...
cd server
node index.js
pause
