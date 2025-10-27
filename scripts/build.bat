@echo off
REM Build script for browser extension (Windows)
REM Creates platform-specific builds for Chrome and Firefox

echo Building browser extension for Chrome and Firefox...

REM Create build directories
if not exist "dist\chrome" mkdir "dist\chrome"
if not exist "dist\firefox" mkdir "dist\firefox"

REM Copy common files
echo Copying common files...
xcopy "extension\*" "dist\chrome\" /E /I /Y
xcopy "extension\*" "dist\firefox\" /E /I /Y

REM Copy platform-specific manifests
echo Setting up Chrome manifest...
copy "extension\manifest-chrome.json" "dist\chrome\manifest.json"

echo Setting up Firefox manifest...
copy "extension\manifest-firefox.json" "dist\firefox\manifest.json"

REM Create icons directory if it doesn't exist
if not exist "dist\chrome\icons" mkdir "dist\chrome\icons"
if not exist "dist\firefox\icons" mkdir "dist\firefox\icons"

echo Build complete!
echo Chrome build: dist\chrome\
echo Firefox build: dist\firefox\
echo.
echo Next steps:
echo 1. Add icons to dist\chrome\icons\ and dist\firefox\icons\
echo 2. Test both builds in their respective browsers
echo 3. Create zip files for store submission
