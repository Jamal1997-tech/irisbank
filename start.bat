@echo off
echo ========================================
echo  DEMARRAGE IRIS BANK
echo ========================================

echo.
echo Nettoyage des processus existants...
taskkill /IM node.exe /F >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo Demarrage du backend...
start "IRIS Bank - Backend" cmd /k "npm run dev"

echo.
echo Attente de 3 secondes pour le backend...
timeout /t 3 /nobreak >nul

echo.
echo Demarrage du frontend...
start "IRIS Bank - Frontend" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo  APPLICATION DEMARREE !
echo ========================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:3001
echo Admin:    admin@irisbank.com / admin123
echo.
echo Utilisez le script 'diagnostic.bat' pour verifier l'etat.
echo.
pause