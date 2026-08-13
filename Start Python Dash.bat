@echo off
setlocal
title Python Dash Launcher
cd /d "%~dp0"

set "NODE_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
set "VINEXT_CLI=%~dp0node_modules\vinext\dist\cli.js"
set "LOCAL_GAME=%~dp0local-runtime\dist\server\index.js"
set "GAME_URL=http://127.0.0.1:3000"

if not exist "%NODE_EXE%" (
  echo.
  echo Python Dash could not find the local runtime already supplied by Codex.
  echo Please open Codex once, then try this launcher again.
  echo.
  pause
  exit /b 1
)

if not exist "%VINEXT_CLI%" (
  echo.
  echo Python Dash could not find its prepared game files.
  echo The complete python-dash folder must stay together.
  echo.
  pause
  exit /b 1
)

if not exist "%LOCAL_GAME%" (
  echo.
  echo Python Dash could not find its prepared local game.
  echo The complete python-dash folder must stay together.
  echo.
  pause
  exit /b 1
)

echo Starting Python Dash locally...
start "Python Dash - close this window to stop" "%~dp0Run Python Dash Server.bat"

timeout /t 5 /nobreak >nul
start "" "%GAME_URL%"
exit /b 0
