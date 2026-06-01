@echo off
cd /d C:\Users\Usuario\hotel-connect-cloud
echo === git add . ===
git add .
echo EXIT_ADD: %ERRORLEVEL%
echo.
echo === git commit -m "fix: build en español regenerado" ===
git commit -m "fix: build en español regenerado"
echo EXIT_COMMIT: %ERRORLEVEL%
echo.
echo === git push origin main ===
git push origin main
echo EXIT_PUSH: %ERRORLEVEL%
echo.
echo === git status -sb ===
git status -sb
