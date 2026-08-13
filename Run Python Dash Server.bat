@echo off
title Python Dash - close this window to stop
set "NODE_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
set "VINEXT_CLI=%~dp0node_modules\vinext\dist\cli.js"
cd /d "%~dp0local-runtime"
echo.
echo  PYTHON DASH IS RUNNING
echo  Keep this window open while students are playing.
echo  Close this window to stop the local game.
echo.
"%NODE_EXE%" "%VINEXT_CLI%" start --host 127.0.0.1
echo.
echo Python Dash has stopped.
pause
