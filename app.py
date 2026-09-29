import os
import subprocess
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
from utils import get_video_info, start_download, DOWNLOAD_JOBS, DOWNLOADS_DIR, format_bytes

app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/info', methods=['POST'])
def api_info():
    data = request.json or {}
    url = data.get('url', '').strip()
    if not url:
        return jsonify({'error': 'Por favor ingresa un enlace válido.'}), 400
    
    try:
        info = get_video_info(url)
        return jsonify(info)
    except Exception as e:
        return jsonify({'error': f'No se pudo obtener información del video: {str(e)}'}), 500

@app.route('/api/download', methods=['POST'])
def api_download():
    data = request.json or {}
    url = data.get('url', '').strip()
    format_id = data.get('format_id', 'bestvideo+bestaudio/best')
    is_audio = data.get('is_audio', False)

    if not url:
        return jsonify({'error': 'URL requerida.'}), 400

    try:
        download_id = start_download(url, format_id, is_audio)
        return jsonify({'download_id': download_id, 'message': 'Descarga iniciada'})
    except Exception as e:
        return jsonify({'error': f'Error al iniciar descarga: {str(e)}'}), 500

@app.route('/api/progress/<download_id>', methods=['GET'])
def api_progress(download_id):
    job = DOWNLOAD_JOBS.get(download_id)
    if not job:
        return jsonify({'error': 'Trabajo de descarga no encontrado'}), 404
    return jsonify(job)

@app.route('/api/downloads', methods=['GET'])
def api_list_downloads():
    files = []
    if os.path.exists(DOWNLOADS_DIR):
        for f in os.listdir(DOWNLOADS_DIR):
            file_path = os.path.join(DOWNLOADS_DIR, f)
            if os.path.isfile(file_path):
                stat = os.stat(file_path)
                files.append({
                    'name': f,
                    'size': format_bytes(stat.st_size),
                    'mtime': stat.st_mtime
                })
        # Sort by most recent
        files.sort(key=lambda x: x['mtime'], reverse=True)
    return jsonify({'files': files})

@app.route('/downloads/<path:filename>')
def download_file(filename):
    return send_from_directory(DOWNLOADS_DIR, filename, as_attachment=True)

@app.route('/api/open-folder', methods=['POST'])
def open_folder():
    try:
        os.makedirs(DOWNLOADS_DIR, exist_ok=True)
        if os.name == 'nt':
            os.startfile(DOWNLOADS_DIR)
        else:
            subprocess.Popen(['xdg-open', DOWNLOADS_DIR])
        return jsonify({'status': 'ok', 'message': 'Carpeta abierta'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("=" * 60)
    print(" [MediaFetch PRO] Servidor de Descarga de Videos iniciado")
    print(" Servidor web activo en: http://127.0.0.1:5000")
    print(" Carpeta de descargas:", DOWNLOADS_DIR)
    print("=" * 60)
    app.run(host='127.0.0.1', port=5000, debug=True)

