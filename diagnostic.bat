@echo off
echo ========================================
echo  DIAGNOSTIC IRIS BANK
echo ========================================

echo.
echo 1. Verification des processus Node.js...
tasklist | findstr node >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ ATTENTION: Processus Node.js detectes
    tasklist | findstr node
    echo.
    echo 💡 Conseil: Executez 'taskkill /IM node.exe /F' pour les arreter
) else (
    echo ✅ Aucun processus Node.js en cours
)

echo.
echo 2. Verification des ports...
netstat -ano | findstr :3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ Port 3000 OCCUPE
    netstat -ano | findstr :3000
) else (
    echo ✅ Port 3000 libre
)

netstat -ano | findstr :3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ Port 3001 OCCUPE
    netstat -ano | findstr :3001
) else (
    echo ✅ Port 3001 libre
)

echo.
echo 3. Test des services...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/' -Method GET -UseBasicParsing -TimeoutSec 5; if ($response.StatusCode -eq 200) { Write-Host '✅ Backend: OK' } else { Write-Host '❌ Backend: Erreur' } } catch { Write-Host '❌ Backend: Hors ligne' }" 2>nul

powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3001/' -Method GET -UseBasicParsing -TimeoutSec 5; if ($response.StatusCode -eq 200) { Write-Host '✅ Frontend: OK' } else { Write-Host '❌ Frontend: Erreur' } } catch { Write-Host '❌ Frontend: Hors ligne' }" 2>nul

echo.
echo ========================================
echo  COMMANDES DE DEMARRAGE
echo ========================================
echo.
echo Pour demarrer proprement:
echo 1. taskkill /IM node.exe /F  (si necessaire)
echo 2. npm run dev              (backend + nodemon)
echo 3. cd frontend ^& npm start    (frontend)
echo.
echo Ou utiliser le script de demarrage automatique...
echo.
pause