document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const videoUrlInput = document.getElementById('videoUrl');
    const btnPaste = document.getElementById('btnPaste');
    const btnClear = document.getElementById('btnClear');
    const btnFetchInfo = document.getElementById('btnFetchInfo');
    const btnText = btnFetchInfo.querySelector('.btn-text');
    const spinner = btnFetchInfo.querySelector('.spinner');

    const previewCard = document.getElementById('previewCard');
    const videoThumb = document.getElementById('videoThumb');
    const videoDuration = document.getElementById('videoDuration');
    const videoUploader = document.getElementById('videoUploader');
    const videoPlatform = document.getElementById('videoPlatform');
    const videoTitle = document.getElementById('videoTitle');
    const formatSelect = document.getElementById('formatSelect');
    const btnStartDownload = document.getElementById('btnStartDownload');

    const progressCard = document.getElementById('progressCard');
    const progressStatusTitle = document.getElementById('progressStatusTitle');
    const progressFileName = document.getElementById('progressFileName');
    const progressPercent = document.getElementById('progressPercent');
    const progressBar = document.getElementById('progressBar');
    const metricDownloaded = document.getElementById('metricDownloaded');
    const metricSpeed = document.getElementById('metricSpeed');
    const metricEta = document.getElementById('metricEta');

    const historyList = document.getElementById('historyList');
    const btnRefreshHistory = document.getElementById('btnRefreshHistory');
    const btnOpenFolderHeader = document.getElementById('btnOpenFolderHeader');
    const toastContainer = document.getElementById('toastContainer');

    let currentVideoData = null;
    let activePollInterval = null;

    // Toast helper
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        const icon = type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check';
        toast.innerHTML = `<i class="fa-solid ${icon}"></i><span>${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // Input handlers
    videoUrlInput.addEventListener('input', () => {
        if (videoUrlInput.value.trim().length > 0) {
            btnClear.classList.remove('hidden');
        } else {
            btnClear.classList.add('hidden');
        }
    });

    btnClear.addEventListener('click', () => {
        videoUrlInput.value = '';
        btnClear.classList.add('hidden');
        previewCard.classList.add('hidden');
        videoUrlInput.focus();
    });

    btnPaste.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                videoUrlInput.value = text;
                btnClear.classList.remove('hidden');
                fetchVideoInfo();
            }
        } catch (err) {
            showToast('No se pudo acceder al portapapeles. Por favor pega manualmente (Ctrl+V).', 'error');
        }
    });

    // Enter key submit
    videoUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            fetchVideoInfo();
        }
    });

    btnFetchInfo.addEventListener('click', fetchVideoInfo);

    async function fetchVideoInfo() {
        const url = videoUrlInput.value.trim();
        if (!url) {
            showToast('Por favor pega un enlace de video válido.', 'error');
            return;
        }

        // UI loading state
        btnText.classList.add('hidden');
        spinner.classList.remove('hidden');
        btnFetchInfo.disabled = true;
        previewCard.classList.add('hidden');

        try {
            const res = await fetch('/api/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Error al obtener datos');
            }

            currentVideoData = data;
            displayPreview(data);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            btnText.classList.remove('hidden');
            spinner.classList.add('hidden');
            btnFetchInfo.disabled = false;
        }
    }

    function displayPreview(data) {
        videoThumb.src = data.thumbnail || '/static/placeholder.jpg';
        videoDuration.textContent = data.duration || '00:00';
        videoUploader.textContent = data.uploader || 'Desconocido';
        videoPlatform.textContent = data.extractor || 'Web';
        videoTitle.textContent = data.title || 'Sin título';

        // Formats options
        formatSelect.innerHTML = '';
        if (data.formats && data.formats.length > 0) {
            data.formats.forEach(f => {
                const opt = document.createElement('option');
                opt.value = f.id;
                opt.dataset.isAudio = (f.type === 'audio') ? 'true' : 'false';
                opt.textContent = `${f.name}`;
                formatSelect.appendChild(opt);
            });
        }

        previewCard.classList.remove('hidden');
        previewCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Start Download
    btnStartDownload.addEventListener('click', async () => {
        if (!currentVideoData) return;

        const selectedOpt = formatSelect.options[formatSelect.selectedIndex];
        const formatId = selectedOpt.value;
        const isAudio = selectedOpt.dataset.isAudio === 'true';

        btnStartDownload.disabled = true;

        try {
            const res = await fetch('/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: currentVideoData.webpage_url || videoUrlInput.value.trim(),
                    format_id: formatId,
                    is_audio: isAudio
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al iniciar descarga');

            showToast('Descarga iniciada...', 'success');
            progressCard.classList.remove('hidden');
            progressCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            startProgressPolling(data.download_id);

        } catch (err) {
            showToast(err.message, 'error');
            btnStartDownload.disabled = false;
        }
    });

    function startProgressPolling(downloadId) {
        if (activePollInterval) clearInterval(activePollInterval);

        activePollInterval = setInterval(async () => {
            try {
                const res = await fetch(`/api/progress/${downloadId}`);
                if (!res.ok) return;

                const job = await res.json();

                if (job.status === 'downloading' || job.status === 'starting') {
                    progressStatusTitle.textContent = 'Descargando archivo...';
                    progressPercent.textContent = `${job.percent}%`;
                    progressBar.style.width = `${job.percent}%`;
                    metricDownloaded.innerHTML = `<i class="fa-solid fa-hard-drive"></i> ${job.downloaded_str} / ${job.total_str}`;
                    metricSpeed.innerHTML = `<i class="fa-solid fa-gauge-high"></i> ${job.speed_str}`;
                    metricEta.innerHTML = `<i class="fa-regular fa-clock"></i> Tiempo aprox: ${job.eta_str}`;
                } else if (job.status === 'processing') {
                    progressStatusTitle.textContent = 'Procesando / Convirtiendo audio...';
                    progressPercent.textContent = '99%';
                    progressBar.style.width = '99%';
                } else if (job.status === 'completed') {
                    clearInterval(activePollInterval);
                    progressStatusTitle.textContent = '¡Descarga completada con éxito! 🎉';
                    progressPercent.textContent = '100%';
                    progressBar.style.width = '100%';
                    progressFileName.textContent = job.filename || 'Archivo guardado';

                    showToast(`Descargado: ${job.filename}`, 'success');
                    btnStartDownload.disabled = false;
                    loadHistory();
                } else if (job.status === 'error') {
                    clearInterval(activePollInterval);
                    progressStatusTitle.textContent = 'Error en la descarga';
                    showToast(`Error: ${job.error}`, 'error');
                    btnStartDownload.disabled = false;
                }
            } catch (err) {
                console.error('Error polling progress:', err);
            }
        }, 1000);
    }

    // Load History
    async function loadHistory() {
        try {
            const res = await fetch('/api/downloads');
            const data = await res.json();

            if (!data.files || data.files.length === 0) {
                historyList.innerHTML = `
                    <div class="empty-history">
                        <i class="fa-regular fa-folder-open"></i>
                        <p>No hay descargas recientes aún.</p>
                    </div>
                `;
                return;
            }

            historyList.innerHTML = '';
            data.files.forEach(f => {
                const isAudio = f.name.endsWith('.mp3') || f.name.endsWith('.m4a') || f.name.endsWith('.wav');
                const icon = isAudio ? 'fa-file-audio' : 'fa-file-video';

                const item = document.createElement('div');
                item.className = 'history-item';
                item.innerHTML = `
                    <div class="history-item-info">
                        <i class="fa-solid ${icon}"></i>
                        <div class="history-item-text">
                            <div class="history-item-name" title="${f.name}">${f.name}</div>
                            <div class="history-item-meta">${f.size}</div>
                        </div>
                    </div>
                    <div class="history-actions">
                        <a href="/downloads/${encodeURIComponent(f.name)}" download class="btn-secondary btn-small" title="Guardar a PC">
                            <i class="fa-solid fa-download"></i> Guardar
                        </a>
                    </div>
                `;
                historyList.appendChild(item);
            });
        } catch (err) {
            console.error('Error al cargar historial:', err);
        }
    }

    btnRefreshHistory.addEventListener('click', loadHistory);

    // Open Downloads Folder
    btnOpenFolderHeader.addEventListener('click', async () => {
        try {
            await fetch('/api/open-folder', { method: 'POST' });
            showToast('Carpeta de descargas abierta.', 'success');
        } catch (err) {
            showToast('No se pudo abrir la carpeta.', 'error');
        }
    });

    // Initial load
    loadHistory();
});
