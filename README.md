# 🎬 MediaFetch PRO - Descargador de Videos y Audio

**MediaFetch PRO** es una aplicación web moderna y fluida desarrollada con **Python (Flask)** y **yt-dlp**, diseñada para extraer y descargar vídeos y audio en alta calidad desde YouTube y cientos de plataformas soportadas.

![MediaFetch PRO](https://img.shields.io/badge/Python-3.8+-blue.svg) ![Flask](https://img.shields.io/badge/Framework-Flask-green.svg) ![yt-dlp](https://img.shields.io/badge/Engine-yt--dlp-red.svg) ![License](https://img.shields.io/badge/License-MIT-brightgreen.svg)

---

## ✨ Características Principal

- 🎥 **Múltiples Calidades de Vídeo**: Permite seleccionar resoluciones desde 4K (2160p), 2K (1440p), Full HD (1080p), HD (720p) hasta 360p.
- 🎵 **Extracción de Audio (MP3/M4A)**: Convierte vídeos a formato de audio en alta fidelidad con un solo clic.
- 📊 **Progreso en Tiempo Real**: Visualización de la barra de progreso, porcentaje completado, velocidad de descarga y tiempo restante.
- 📁 **Gestor de Descargas**: Acceso a la lista de archivos descargados con botón directo para abrir la carpeta local en tu sistema.
- 🎨 **Interfaz Premium & Responsiva**: Diseño oscuro, moderno, intuitivo y adaptable a dispositivos móviles y de escritorio.

---

## 🛠️ Requisitos Previos

- **Python 3.8** o superior instalado en el sistema.
- **FFmpeg** *(Recomendado)*: Necesario para fusionar el audio y vídeo en máxima calidad (1080p, 4K) y para realizar conversiones directas a MP3.

---

## 🚀 Instalación y Uso Rápido

### En Windows (Método Automático)

Simplemente ejecuta el archivo batch incluido:
```cmd
start.bat
```
Este script creará automáticamente el entorno virtual (`.venv`), instalará las dependencias necesarias de `requirements.txt`, iniciará el servidor web en `http://127.0.0.1:5000` y abrirá la aplicación en tu navegador predeterminado.

---

### En Linux / macOS / Windows (Manual)

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Beer17/Descargar-videos-.git
   cd Descargar-videos-
   ```

2. **Crear y activar un entorno virtual:**
   ```bash
   # En Linux / macOS:
   python3 -m venv .venv
   source .venv/bin/activate

   # En Windows (PowerShell):
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   ```

3. **Instalar dependencias:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Ejecutar la aplicación:**
   ```bash
   python app.py
   ```

5. Abrir el navegador e ingresar a: `http://127.0.0.1:5000`

---

## 📂 Estructura del Proyecto

```text
├── app.py              # Servidor backend Flask y endpoints API
├── utils.py            # Lógica de extracción de formatos y descargas con yt-dlp
├── requirements.txt    # Dependencias de Python (Flask, yt-dlp, flask-cors)
├── start.bat           # Script de arranque automático para Windows
├── .gitignore          # Archivos e historial excluidos de Git
├── templates/
│   └── index.html      # Estructura principal de la aplicación Web
└── static/
    ├── css/style.css   # Estilos UI modernos en CSS3
    └── js/app.js       # Consumo de la API y control de interfaz en JavaScript
```

---

## 📜 Licencia

Este proyecto está distribuido bajo la licencia MIT. Siéntete libre de modificarlo y mejorarlo.
