import os
import re
import uuid
import threading
import shutil

import yt_dlp

# Directory for saving downloads
DOWNLOADS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'downloads')
os.makedirs(DOWNLOADS_DIR, exist_ok=True)

# Find ffmpeg location if available
FFMPEG_PATH = None
possible_ffmpeg_paths = [
    r"C:\Program Files\BlueStacks_nxt\ffmpeg.exe",
    r"C:\Program Files\SteelSeries\GG\apps\moments\ffmpeg.exe"
]
for p in possible_ffmpeg_paths:
    if os.path.exists(p):
        FFMPEG_PATH = os.path.dirname(p)
        break

if not FFMPEG_PATH:
    system_ffmpeg = shutil.which("ffmpeg")
    if system_ffmpeg:
        FFMPEG_PATH = os.path.dirname(system_ffmpeg)

# Global dictionary to track active/past downloads
# key: download_id, value: dict with progress metadata
DOWNLOAD_JOBS = {}

def format_bytes(bytes_count):
    if not bytes_count:
        return "0 MB"
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_count < 1024.0:
            return f"{bytes_count:.2f} {unit}"
        bytes_count /= 1024.0
    return f"{bytes_count:.2f} TB"

def format_duration(seconds):
    if not seconds:
        return "Desconocido"
    seconds = int(seconds)
    m, s = divmod(seconds, 60)
    h, m = divmod(m, 60)
    if h > 0:
        return f"{h:d}:{m:02d}:{s:02d}"
    return f"{m:02d}:{s:02d}"

def get_video_info(url):
    """
    Extracts video or playlist metadata without downloading.
    """
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
    }
    if FFMPEG_PATH:
        ydl_opts['ffmpeg_location'] = FFMPEG_PATH

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        
        # Check if playlist
        if 'entries' in info:
            entry = info['entries'][0] if info['entries'] else {}
            title = info.get('title', 'Lista de reproducción')
        else:
            entry = info
            title = info.get('title', 'Video sin título')

        thumbnail = entry.get('thumbnail') or info.get('thumbnail') or ''
        duration = format_duration(entry.get('duration') or info.get('duration'))
        uploader = entry.get('uploader') or entry.get('channel') or info.get('uploader') or 'Desconocido'
        extractor = info.get('extractor_key', 'Desconocido')

        # Filter and summarize qualities
        formats_list = [
            {
                'id': 'bestvideo+bestaudio/best',
                'name': '🎬 Máxima Calidad (1080p / 2K / 4K)',
                'quality': '1080p/4K+',
                'type': 'video'
            },
            {
                'id': 'best[height<=720]',
                'name': '📹 Calidad Alta (720p HD MP4)',
                'quality': '720p',
                'type': 'video'
            },
            {
                'id': 'best[height<=480]',
                'name': '📱 Calidad Estándar (480p MP4)',
                'quality': '480p',
                'type': 'video'
            },
            {
                'id': 'bestaudio/best',
                'name': '🎵 Solo Audio MP3 (Música / Podcast)',
                'quality': 'MP3 Audio',
                'type': 'audio'
            }
        ]

        return {
            'title': title,
            'thumbnail': thumbnail,
            'duration': duration,
            'uploader': uploader,
            'extractor': extractor,
            'webpage_url': info.get('webpage_url', url),
            'formats': formats_list
        }

def download_worker(download_id, url, format_id, is_audio):
    job = DOWNLOAD_JOBS[download_id]

    def progress_hook(d):
        if d['status'] == 'downloading':
            total = d.get('total_bytes') or d.get('total_bytes_estimate') or 0
            downloaded = d.get('downloaded_bytes', 0)
            speed = d.get('speed') or 0
            eta = d.get('eta') or 0
            
            percent = (downloaded / total * 100) if total > 0 else 0
            
            job['status'] = 'downloading'
            job['percent'] = round(percent, 1)
            job['downloaded_str'] = format_bytes(downloaded)
            job['total_str'] = format_bytes(total)
            job['speed_str'] = f"{format_bytes(speed)}/s"
            job['eta_str'] = f"{eta}s" if eta else "calculando..."
            
        elif d['status'] == 'finished':
            job['status'] = 'processing'
            job['percent'] = 99.0
            job['status_text'] = 'Convertiendo y guardando...'

    ydl_opts = {
        'outtmpl': os.path.join(DOWNLOADS_DIR, '%(title)s.%(ext)s'),
        'progress_hooks': [progress_hook],
        'quiet': True,
        'no_warnings': True,
    }

    if FFMPEG_PATH:
        ydl_opts['ffmpeg_location'] = FFMPEG_PATH

    if is_audio or format_id == 'bestaudio/best':
        ydl_opts['format'] = 'bestaudio/best'
        ydl_opts['postprocessors'] = [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }]
    else:
        if format_id:
            ydl_opts['format'] = format_id
        else:
            ydl_opts['format'] = 'bestvideo+bestaudio/best'

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            if is_audio and not filename.endswith('.mp3'):
                filename = os.path.splitext(filename)[0] + '.mp3'

            job['status'] = 'completed'
            job['percent'] = 100.0
            job['filename'] = os.path.basename(filename)
            job['filepath'] = filename
            if os.path.exists(filename):
                job['filesize'] = format_bytes(os.path.getsize(filename))
            else:
                job['filesize'] = "Completado"
    except Exception as e:
        job['status'] = 'error'
        job['error'] = str(e)

def start_download(url, format_id='bestvideo+bestaudio/best', is_audio=False):
    download_id = str(uuid.uuid4())
    DOWNLOAD_JOBS[download_id] = {
        'download_id': download_id,
        'url': url,
        'status': 'starting',
        'percent': 0,
        'downloaded_str': '0 MB',
        'total_str': '0 MB',
        'speed_str': '0 KB/s',
        'eta_str': '--',
        'filename': None,
        'error': None
    }
    
    thread = threading.Thread(target=download_worker, args=(download_id, url, format_id, is_audio))
    thread.daemon = True
    thread.start()
    
    return download_id
