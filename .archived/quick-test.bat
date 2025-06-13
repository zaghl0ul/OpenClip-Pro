@echo off 
title OpenClipREDUX - Quick Test 
echo. 
echo 🧪 OpenClipREDUX Quick Test 
echo ======================= 
echo. 
echo Testing backend health... 
curl -s http://localhost:8000/health | python -m json.tool 
echo. 
echo Opening application in browser... 
start http://localhost:5173 
echo. 
pause 
