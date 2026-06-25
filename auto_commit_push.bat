@echo off
rem Auto-stage all changes
git add -A

rem Commit with timestamp message
for /f "tokens=1-3 delims=/ " %%a in ("%date%") do set dt=%%c-%%a-%%b
for /f "tokens=1-2 delims=: " %%a in ("%time%") do set tm=%%a:%%b
git commit -m "Auto commit %dt% %tm%"

rem Push to remote
git push
