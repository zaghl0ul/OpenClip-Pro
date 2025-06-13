@echo off
echo Setting up GitHub repository for OpenClipREDUX...
echo.

echo Step 1: Please create a new repository on GitHub.com
echo - Go to https://github.com/new
echo - Repository name: OpenClipREDUX
echo - Make it public or private (your choice)
echo - DO NOT initialize with README, .gitignore, or license
echo - Click "Create repository"
echo.

pause
echo.

echo Step 2: Enter your GitHub username and repository details
set /p username="Enter your GitHub username: "
set /p reponame="Enter repository name (default: OpenClipREDUX): "

if "%reponame%"=="" set reponame=OpenClipREDUX

echo.
echo Adding GitHub remote and pushing code...

rem Add the new GitHub remote
git remote add origin https://github.com/%username%/%reponame%.git

rem Check current status
echo Current git status:
git status

echo.
echo Committing any uncommitted changes...
git add .
git commit -m "Initial commit: OpenClipREDUX - AI-Powered Video Clip Generator"

echo.
echo Pushing to GitHub...
git branch -M main
git push -u origin main

echo.
echo Done! Your repository should now be available at:
echo https://github.com/%username%/%reponame%
echo.

pause
