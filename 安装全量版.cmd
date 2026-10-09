@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist "安装程序\2026-10-09-r1\TerraDeskMat-Setup-0.3.0.exe" (echo 安装程序尚未生成，请先阅读README。 & pause & exit /b 1)
start "" "%~dp0安装程序\2026-10-09-r1\TerraDeskMat-Setup-0.3.0.exe"
