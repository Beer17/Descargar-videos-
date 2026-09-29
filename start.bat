@echo off
title MediaFetch PRO - Servidor de Descargas
echo ========================================================
echo   Iniciando MediaFetch PRO - Descargador de Videos
echo ========================================================
echo.

if not exist .venv (
    echo Creando entorno virtual Python...
    "C:\Users\creat\AppData\Local\Programs\Python\Python314\python.exe" -m venv .venv
    .venv\Scripts\pip.exe install -r requirements.txt
)

echo Iniciando servidor Web en http://127.0.0.1:5000
start http://127.0.0.1:5000
.venv\Scripts\python.exe app.py
pause
