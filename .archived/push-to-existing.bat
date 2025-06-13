@echo off
echo Pushing OpenClipREDUX updates to existing repository...
echo.

echo Current repository: https://github.com/zaghl0ul/OCP2
echo.

echo Checking current status...
git status

echo.
echo Adding all changes...
git add .

echo.
echo Committing changes...
git commit -m "Update OpenClipREDUX: Enhanced AI-powered video clip generator with modern features"

echo.
echo Pushing to remote repository...
git push ocp2 master

echo.
echo Done! Changes pushed to https://github.com/zaghl0ul/OCP2
echo.

pause
