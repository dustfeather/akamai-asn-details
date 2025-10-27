@echo off
REM Package script for browser extension (Windows)
REM Creates zip files for store submission

echo Packaging browser extension for store submission...

REM Ensure builds exist
if not exist "dist\chrome" (
    echo Chrome build not found. Run 'npm run build' first.
    exit /b 1
)

if not exist "dist\firefox" (
    echo Firefox build not found. Run 'npm run build' first.
    exit /b 1
)

REM Create packages directory
if not exist "packages" mkdir "packages"

REM Create Chrome package
echo Creating Chrome package...
cd dist\chrome
powershell Compress-Archive -Path * -DestinationPath "..\..\packages\chrome-extension.zip" -Force
cd ..\..

REM Create Firefox package
echo Creating Firefox package...
cd dist\firefox
powershell Compress-Archive -Path * -DestinationPath "..\..\packages\firefox-extension.zip" -Force
cd ..\..

echo Packages created successfully!
echo Chrome package: packages\chrome-extension.zip
echo Firefox package: packages\firefox-extension.zip
echo.
echo Ready for store submission!
